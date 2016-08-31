(function (Controller) {
    'use strict';

    var async         = require('async'),
        fse           = require('fs-extra'),
        path          = require('path'),
        util          = require('util'),
        uuid          = require('uuid'),

        database      = require('./database'),
        settings      = require('./settings'),
        controller    = require('./controller'),
        constants     = require('./constants'),
        uploads       = require('./uploads'),
        
        nodebb        = require('./nodebb'),
        utils         = nodebb.utils,
        helpers       = nodebb.helpers,
        user          = nodebb.user,
        nconf         = nodebb.nconf,
        notifications = nodebb.notifications,
        plugins       = nodebb.plugins;

    Controller.awardUsers = function (payload, fromUid, done) {
        var recipients = [],
            awardId    = parseInt(payload.award, 10);

        async.waterfall([
            function (callback) {
                async.each(payload.users, function (user, next) {
                    async.series([
                        async.apply(database.createGrant, user.uid, awardId, payload.reason, fromUid),
                        function (pushed) {
                            recipients.push(user.uid);
                            pushed();
                        }
                    ], next);
                }, callback);
            },
            async.apply(database.getAward, awardId),
            function (award, callback) {
                notifications.create({
                   bodyShort: util.format('Congratulations! You have received "%s" award.', award.name),
                   nid      : 'aid:' + awardId + ':uids:' + recipients.join('-'),
                   from     : fromUid,
                   aid      : awardId,
                   path     : "/awards"
                }, callback);
            },
            function (notification, callback) {
                if (notification) {
                    notifications.push(notification, recipients, callback);
               }
            }
        ], done);
    };

    Controller.deleteGrantById = function (gid, done) {
        database.deleteGrant(gid, done);
    };

    Controller.deleteUserGrants = function (uid, done) {
        async.waterfall([
            async.apply(database.getGrantIdsByUser, uid, -1),
            function (grantIds, callback) {
                async.each(grantIds, function (gid, next) {
                    database.deleteGrant(gid, next);
                }, callback);
            }
        ], done);
    };
    
    /**
     * Edit award.
     *
     * @param aid - award identifier
     * @param name - award name
     * @param description - award description
     * @param type - automatic award type (postCnt, rep, etc.)*
     * @param cond - automatic award condition*
     * @param condval - automatic award condition value that has to be met for rewarding*
     * @param reason -  automatic award reason of the grant*
     *  *if one of those is set, you need to set the others too!
     * @param upload - optional file descriptor, to get filename, 'uploads' module should be used
     * @param done {function}
     */
    Controller.editAward = function (aid, name, description, upload, type, cond, condval, reason, limit, userLimit, done) {
        var update = {
            name     : name,
            desc     : description,
            type     : type,
            cond     : cond,
            condval  : condval,
            reason   : reason,
            limit    : limit,
            userLimit: userLimit
        };

        upload = upload || {};

        async.waterfall([
            async.apply(uploads.getFileById, upload.id),
            function (file, next) {
                if (file) {
                    Controller.editImage(aid, file, function (error, imageName) {
                        if (error) {
                            return next(error);
                        }
                        update.image = imageName;
                        next(null);
                    });
                } else {
                    next(null);
                }
            },
            async.apply(database.editAward, aid, update)
        ], done);
    };

    Controller.editGrant = function (gid, reason, done) {
        database.editGrant(gid, {reason: reason}, done);
    };
    
        
    /**
     * Update image. Delete old one if any.
     *
     * @param aid {number} award identifier
     * @param file {object} file descriptor from 'uploads' module
     * @param done {function} returns image name if operation was successful
     */
    Controller.editImage = function (aid, file, done) {
        async.waterfall([
            async.apply(database.getAward, aid),
            function (award, next) {
                if (!award) {
                    return next(new Error('Award can not be found'));
                }

                //Remove old image
                if(uploads.isOnFileSystem(award.image)){
                    fse.remove(uploads.getUploadImagePath(award.image));
                }
                next(null,award);
            },
            function (award, next) {
                if (plugins.hasListeners('filter:uploadImage')) {
                    file.name = file.filename;
                    plugins.fireHook('filter:uploadImage', {image: file, uid: uuid.v4()}, next);
                }else {
                    fse.copy(file.path, uploads.getUploadImagePath(file.filename));
                    next(null, file);
                }
            },
            function (modifiedFile, next) {
                next(null, uploads.getPublicImagePath(modifiedFile));
            }
        ], done);
    };

    Controller.getAllAwards = function (done) {
        async.waterfall([
            async.apply(database.getAllAwards),
            function (awards, next) {
                async.map(awards, function (award, next) {
                    award.picture = award.image;

                    Controller.getAwardRecipients(award.aid, function (error, grants) {
                        if (error) {
                            return next(error);
                        }

                        award.grants = grants;
                        next(null, award);
                    });
                }, function (error, awards) {
                    if (error) {
                        return next(error);
                    }

                    next(null, {
                        awards     : awards,
                        breadcrumbs: helpers.buildBreadcrumbs([{text: 'Awards'}]),
                        title      : "Awards"
                    });
                });
            }
        ], done);
    };
        
    Controller.getAwardRecipients = function (aid, done) {
        async.waterfall([
            async.apply(database.getGrantIdsByAward, aid),
            function (grantIds, next) {
                grantIds = grantIds || [];
                database.getGrantsByIds(grantIds, next);
            },
            function (grants, next) {
                async.map(grants, function (grant, next) {
                    user.getUserFields(grant.uid, ['username', 'userslug', 'picture', 'icon'], function (error, user) {
                        if (error) {
                            return next(error);
                        }
                        grant.user = user;
                        next(null, grant);
                    });
                }, next);
            }
        ], done);
    };

    Controller.getAwardsTopic = function (payload, done) {
        async.waterfall([
            async.apply(settings.get),
            function (settings, postsDidProcess) {
                if (settings.renderTopic) {

                    async.map(payload.posts, function (post, next) {

                        Controller.getUserAwards(post.uid, settings.maxAwardsTopic, function (error, grants) {
                            if (error) {
                                return next(error);
                            }
                            post.grants = grants;
                            next(null, post);
                        });
                    }, function (error, postsWithGrants) {
                        if (error) {
                            return postsDidProcess(error);
                        }
                        payload.posts = postsWithGrants;
                        postsDidProcess(null, payload);
                    });

                } else {
                    //Skip render
                    postsDidProcess(null, payload);
                }
            }
        ], done);
    };

    Controller.getUserAwards = function (uid, limit, done) {
        async.waterfall([
            async.apply(database.getGrantIdsByUser, uid, limit),
            function (grantIds, next) {
                if (!grantIds) {
                    return next(null, []);
                }

                database.getGrantsByIds(grantIds, next);
            },
            function (grants, next) {
                async.map(grants, function (grant, next) {

                    grant.createtimeiso = utils.toISOString(grant.createtime);

                    async.parallel({
                        award: async.apply(database.getAward, grant.aid),
                        user : async.apply(user.getUserFields, grant.fromuid, ['username', 'userslug'])
                    }, function (error, result) {
                        if (error) {
                            return next(error);
                        }

                        var award = result.award, user = result.user;

                        award.picture = award.image;
                        grant.award = award;
                        grant.fromuser = user;
                        next(null, grant);
                    });
                }, next);
            }
        ], done);
    };
    
    Controller.saveValidSettings = function (data, done) {
        settings.get(function (error, values) {
            if (error) {
                return done(error);
            }
            var newSettings = getValidFields(values, data);
            settings.save(newSettings, done);
        });

    };
    
    
     /**
     * Initiate the process of checking if an award can be granted to the uid
     *
     * @param type {string} award type identifier
     * @param uid {int} user id
     * @param done {function} returns true if at least an award was granted
     */
    Controller.autoAward = function (type, uid, done) {
        switch(type) {
            case 'postCnt':
                controller.checkPostCountType(uid, function(finish) {
                   done(finish);
                });
                break;               
             case 'rep':
                  controller.checkReputationType(uid, function(finish) {
                    done(finish);
                 });
                 break;
             default: 
                done;
        }
    };
    
     /**
     * Check for conditions
     *
     * @param cond {string} award condition
     * @param user {object} the user to check if meets condition
     * @param done {function} returns payload if can be awarded
     */
    Controller.checkCondition = function (award, user, done) {
        switch(award.cond) {
            case 'equal':
                if(user.cond == award.condval) {
                    controller.checkAwardLimitReached (award, user.uid, function(check) {
                        if(check) {
                            done({'users':{user}, 'award':award.aid, 'reason':award.reason});
                        } 
                    });
                } 
                break;
             case 'every':
                if((user.cond % award.condval) == 0) {
                    controller.checkAwardLimitReached (award, user.uid, function(check) {
                        if(check) {
                            done({'users':{user}, 'award':award.aid, 'reason':award.reason});
                        } 
                    });
                } 
                break;
             default:
                done;
            
        }
    };
    
    /**
     * Check if maximum number of award were already granted
     *
     * @param award {object} the award to check
     * @param done {function} returns true if limit not reached
     */
    Controller.checkAwardLimitReached = function (award, uid, done) {
        async.waterfall([
            async.apply(database.getGrantIdsByAward, award.aid),
            function (grants, next) {
                if(grants.length < award.limit || award.limit == 0) {
                   controller.sameAwardCount(uid, award.aid, function(count) {
                       if(count < award.userLimit || award.userLimit == 0) {
                           next(true)
                        };
                   });
                }
            }
        ], done);
    };
    
    /**
     * Check how many award of the same type have been granted to an user
     *
     * 
     * @param uid {object} uid of the user to check
     * @param aid {object} aid of the award to check
     * @param done {function} returns the count of the same award granted to the user
     */
    Controller.sameAwardCount = function (uid, aid, done) {
        async.waterfall([
            async.apply(database.getGrantIdsByUserAndAward, uid, aid),
            function (grantIds, next) {
                if (!grantIds) {
                    console.log(grandIds);
                    return next(null, []);
                }
                next(grantIds.length);
            }
        ], done);
    };

    
     /**
     * Check if an award of type PostCount can be granted
     *
     * @param uid {integer} uid of the user to check
     * @param done {function} returns true if an award was granted
     */
    Controller.checkPostCountType = function (uid, done) {
        async.waterfall([
            async.apply(database.getAllAwardsByType, 'postCnt'),
            function (awards, next) {
                 user.getUserFields(uid, ['postcount'], function (error, user) {
                     if(error) {
                         next(error);
                     }
                         next(null, awards, user);
                 });
            },
            function (awards, user, next) {
                async.map(awards, function(award) {
                    user.cond = user.postcount;
                    controller.checkCondition(award, user, function (payload) {
                        if(payload) {
                            //For now the uid is 1, should this be in the settings?             
                            controller.awardUsers(payload, 1); 
                            next(true);
                        }
                    });
                }, next);
            }
        ], done);
    };
                             
     /**
     * Check if an award of type rep (Reputation) can be granted
     *
     * @param uid {integer} uid of the user to check
     * @param done {function} returns true if an award was granted
     */
    Controller.checkReputationType = function (uid, done) {
        async.waterfall([
            async.apply(database.getAllAwardsByType, 'rep'),
            function (awards, next) {
                 user.getUserFields(uid, ['reputation'], function (error, user) {
                     if(error) {
                         next(error);
                     }
                         next(null, awards, user);
                 });
            },
            function (awards, user, next) {
                async.map(awards, function(award) {
                    user.cond = user.reputation;
                    controller.checkCondition(award, user, function (payload) {
                        if(payload) {
                            controller.awardUsers(payload, 1);
                            next(true); 
                        } 
                    });
                }, next);
            }
        ], done);
    };

    function getValidFields(fields, object) {
        var shallowCopy = {};
        for (var field in fields) {
            if (field in object) {
                shallowCopy[field] = object[field];
            }
        }
        return shallowCopy;
    }
    

})(module.exports);