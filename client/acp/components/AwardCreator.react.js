var React            = require('react'),
    LinkedStateMixin = require('react/lib/LinkedStateMixin'),

    ImageDrop        = require('./ImageDrop.react'),
    PanelControls    = require('./PanelControls.react'),
    PromptView       = require('./PromptView.react'),
    pathUtils        = require('../utils/PathUtils'),
    Actions          = require('../actions/Actions');
    

var AwardCreator = React.createClass({
    mixins: [LinkedStateMixin],

    getInitialState: function () {
        return {
            action   : pathUtils.getApiImages(),
            dataUrl  : '',
            name     : '',
            desc     : '',
            open     : false,
            cond     : '',
            condval  : '',
            reason   : '',
            type     : '',
            limit    : '',
            userLimit: '',
            autoAward: false
        };
    },

    render: function () {
        var panelContent, autoAward, error;

        if (this.state.errorMessage) {
            error = <div className="alert alert-danger" role="alert">Error: {this.state.errorMessage}</div>;
        }
        
        /* 
        * valueLink is deprecated in React 15.*
        * Probably this all thing should be changed.
        * Don't know why but upgrading React breaks the code.
        *
        */
        if (this.state.autoAward) {
            autoAward = <div>
            <div className="form-group">
                <label htmlFor="awardType">Type</label>
                <select className="form-control" id="awardType" valueLink={this.linkState('type')}>
                    <option value="" disabled>Choose one...</option>
                    <option value="postCnt">Post Count</option>
                    <option value="rep">Reputation</option>
                </select>
            </div> 
            <div className="form-group">
                <label htmlFor="awardContition">Condition</label>
                <select className="form-control" id="awardCondition" valueLink={this.linkState('cond')} >
                    <option value="" disabled>Choose one...</option>
                    <option value="every">every</option>
                    <option value="equal">=</option>
                </select>
                <input
                    type="text" className="form-control" id="awardCondVal" placeholder="Enter a number"
                    valueLink={this.linkState('condval')}/>
            </div>
            <div className="form-group">
                    <label htmlFor="awardReason">Reason</label>
                    <textarea className="form-control" rows="4" id="awardReason"
                              placeholder="Enter the reason that should be displayed for automatic awards"
                              valueLink={this.linkState('reason')}></textarea>
             </div>
            <div className="form-group">
                <label htmlFor="awardLimit">Limit (total number of awards that can be obtained by everyone, not only a single user)</label>
                <input
                    type="text" className="form-control" id="awardLimit" placeholder="Enter a number (0 for infinite)"
                    valueLink={this.linkState('limit')}/>
            </div>
             <div className="form-group">
                <label htmlFor="userLimit">Limit of awards per single user</label>
                <input
                    type="text" className="form-control" id="userLimit" placeholder="Enter a number (0 for infinite)"
                    valueLink={this.linkState('userLimit')}/>
            </div>
            
        </div>;
        } 
        
        if (this.state.open) {
            panelContent = <form className="create-award-form">
                <div className="media">
                    <div className="media-body" style={{width: '100%'}}>
                        <div className="form-group">
                            <label htmlFor="awardName">Name</label>
                            <input
                                type="text" className="form-control" id="awardName" placeholder="Enter name"
                                valueLink={this.linkState('name')}/>
                        </div>
                    </div>
                    <div className="media-right media-middle">
                        <ImageDrop
                            action={this.state.action}
                            dataUrl={this.state.dataUrl}
                            imageDidSelect={this._imageDidSelect}
                            success={this._uploadSuccess}
                            error={this.uploadDidError}
                            uploadProgress={this._uploadProgress}/>
                    </div>
                </div>
                {error}
                <div className="form-group">
                    <label htmlFor="awardDesc">Description</label>
                    <textarea className="form-control" rows="4" id="awardDesc"
                              placeholder="Enter full description"
                              valueLink={this.linkState('desc')}></textarea>
                </div>
                   <input type="checkbox" onChange={this._toggleAutoAward} />
                    <span>Automatic Award</span>    
                 {autoAward}      
                <PanelControls labelSuccess="Add" valid={this._isValid} cancelDidClick={this._cancelAwardForm}
                               successDidClick={this._createAward}/>
            </form>;
        } else {
            panelContent = <PromptView
                label="Create Award..."
                hint="Give short and clear names for awards, treat them like medals, for example: 'Four-Way Medal' or 'Miss Universe'"
                labelDidClick={this._promptViewDidClick}/>;
        }

        return (
            <div className="panel panel-default">
                <div className="panel-body">
                    {panelContent}
                </div>
            </div>
        );
    },
    
     _setType: function (value) {
       this.setState({
          type: value 
       });
    },
    
    _setCond: function (value) {
       this.setState({
          cond: value 
       });
    },
    
    _toggleAutoAward: function () {
       this.setState({
          autoAward: !this.state.autoAward 
       });
    },

    _cancelAwardForm: function () {
        this.replaceState(this.getInitialState());
    },

    _createAward: function () {
        Actions.createAward(this.state.name, this.state.desc, this.state.fileServer.id, this.state.type, this.state.cond, this.state.condval, this.state.reason, this.state.limit, this.state.userLimit);
        this._cancelAwardForm();
    },

    _imageDidSelect: function (file, dataUrl) {
        this.setState({
            dataUrl: dataUrl
        });
    },
    
    _isValid: function () {
        if (this.state.autoAward) {
            return !!this.state.name && !!this.state.desc && !!this.state.fileServer && !!this.state.type && !!this.state.cond && !!this.state.condval && !!this.state.reason && !!this.state.limit && !!this.state.userLimit;  
        } else {
            return !!this.state.name && !!this.state.desc && !!this.state.fileServer;
        }
    },

    _promptViewDidClick: function () {
        this.setState({
            open: true
        });
    },

    uploadDidError: function (file, errorMessage) {
        this.setState({
            errorMessage: errorMessage
        });
    },

    _uploadProgress: function (file, progress, bytesSent) {
        //noop: could be used in future for indication
    },

    _uploadSuccess: function (fileClient, fileServer) {
        this.setState({
            fileClient: fileClient,
            fileServer: fileServer
        });
    }
});

module.exports = AwardCreator;
