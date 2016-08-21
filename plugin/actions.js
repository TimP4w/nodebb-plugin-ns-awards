(function (Action) {
    'use strict';

    var controller    = require('./controller'),
        nodebb        = require('./nodebb'),
        user          = nodebb.user;

     /**
     * Check Post to see if automatic award is available.
     *
     * @param data - 
     * @param done {function}
     */
    Action.onPost = function (data) {
        controller.checkConditionAndAward('postCnt', data.uid, function(cb) {

        })
    };
 
    Action.onUpvote = function (data) {
       controller.checkConditionAndAward('rep', data.uid, function(cb) {

        }) 
    }
 
})(module.exports);
