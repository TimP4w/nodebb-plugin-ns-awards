(function (Action) {
    'use strict';

    var controller    = require('./controller'),
        database      = require('./database'),
        nodebb        = require('./nodebb'),
        async         = require('async'),
        user          = nodebb.user;
        
     /**
     * Listen to Post Save Hook and check for award
     *
     * @param data
     *
     */
    Action.onPost = function (data) {
       
        controller.autoAward('postCnt', data.uid, function(awarded) {

        });
    };
    
     /**
     * Listen to upVote Hook and check for award
     *
     * @param data ({ pid: 318, uid: 3, owner: 1, current: 'unvote' })
     * 
     */
    Action.onUpvote = function (data) {
       controller.autoAward('rep', data.owner, function(awarded) {
            
        });
    };                   
    
 
})(module.exports);
