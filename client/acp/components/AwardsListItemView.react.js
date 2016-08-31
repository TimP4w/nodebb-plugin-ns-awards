var React          = require('react'),
    bootbox        = require('bootbox'),
    ReactPropTypes = React.PropTypes,
    classNames     = require('classnames'),
    ImageUpdate    = require('./ImageUpdate.react'),
    pathUtils      = require('../utils/PathUtils'),
    noop           = require('lodash/utility/noop'),
    Actions        = require('../actions/Actions');


var AwardsListItemView = React.createClass({
    propTypes: {
        award         : ReactPropTypes.object.isRequired,
        edit          : ReactPropTypes.bool.isRequired,
        itemWillEdit  : ReactPropTypes.func.isRequired,
        itemWillCancel: ReactPropTypes.func.isRequired,
        itemWillSave  : ReactPropTypes.func.isRequired
    },

    getInitialState: function () {
        return {
            name         : this.props.award.name,
            desc         : this.props.award.desc,
            dataUrl      : '',
            initImage    : this.props.award.image,
            type         : this.props.award.type,
            cond         : this.props.award.cond,
            condval      : this.props.award.condval,
            reason       : this.props.award.reason,
            limit        : this.props.award.limit,
            userLimit    : this.props.award.userLimit,
            autoAwardForm: !!this.props.award.type
        }
    },

    render: function () {
        var self        = this,
            controls    = getControls(this.props.edit),
            content     = getContent(this.props.edit),
            autoContent = getAutoContent(this.state.autoAwardForm, this.props.edit),
            image       = getImage(this.props.edit);
        
        function getAutoContent(type, edit) {
            if (edit && type) {
                return (
                    <div className="award-edit">
                        <div>
                            <select value={self.state.type} onChange={self._typeDidChange}>
                                <option value="" disabled>Choose one...</option>
                                <option value="postCnt">Post Count</option>
                                <option value="rep">Reputation</option>
                            </select>
                        </div>
                        <div>
                            <select value={self.state.cond} onChange={self._conditionDidChange}>
                                <option value="" disabled>Choose one...</option>
                                <option value="every">every</option>
                                <option value="equal">=</option>
                            </select>   
                            </div>
                            <div>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter Condition Value"
                                    value={self.state.condval}
                                    onChange={self._condvalDidChange}/>
                            </div>
                            <div>
                                <textarea className="form-control" rows="4"
                                        placeholder="Enter reason"
                                        value={self.state.reason}
                                        onChange={self._reasonDidChange}></textarea>
                            </div>
                            <div>
                            <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter Limit"
                                    value={self.state.limit}
                                    onChange={self._limitDidChange}/>
                            </div>
                            <div>
                            <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter User Limit"
                                    value={self.state.userLimit}
                                    onChange={self._userLimitDidChange}/>
                            </div>
                      </div>
                );
            } else {
                return "";
            }
        }
        
        function getContent(edit) {
            if (edit) {
                return (
                    <div className="award-edit">
                        <div>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Enter name"
                                value={self.state.name}
                                onChange={self._nameDidChange}/>
                        </div>
                        <div>
                            <textarea className="form-control" rows="4"
                                      placeholder="Enter description"
                                      value={self.state.desc}
                                      onChange={self._descriptionDidChange}></textarea>
                        </div>
                        <input type="checkbox" onChange={self._toggleAutoAwardForm} checked={self.state.autoAwardForm} />
                        <span>Automatic Award</span>  
                    </div>
                    
                );
            } else {
                return (
                    <dl>
                        <dt>{self.props.award.name}</dt>
                        <dd>{self.props.award.desc}</dd>
                        <dt>{ !self.props.award.type ? "Only manually" : "Auto award on " + self.props.award.type + " condition: " + self.props.award.cond + " " + self.props.award.condval + " Reason: " + self.props.award.reason + " Limit: " + self.props.award.limit + " User Limit: " + self.props.award.userLimit}</dt>
                    </dl>
                );
            }
        }
        
        function getControls(edit) {
            if (edit) {
                var controlOkClass = classNames({
                    'fa'           : true,
                    'fa-check'     : true,
                    'icon-control' : true,
                    'icon-ok'      : true,
                    'icon-disabled': !self._isValid()
                });

                return (
                    <div>
                        <i className={controlOkClass}
                           onClick={self._save}></i>
                        <i className="fa fa-remove icon-danger icon-control"
                           onClick={self._cancel}></i>
                    </div>
                );
            } else {
                return (
                    <div>
                        <i className="fa fa-pencil icon-control"
                           onClick={self.props.itemWillEdit}></i>
                        <i className="fa fa-trash-o icon-danger icon-control"
                           onClick={self._deleteItem}></i>
                    </div>
                );
            }
        }

        function getImage(edit) {
            if (edit) {
                return (
                    <ImageUpdate
                        action={pathUtils.getApiImages()}
                        currentImageUrl={self.state.initImage}
                        dataUrl={self.state.dataUrl}
                        resetImage={self._resetImage}
                        imageDidSelect={self._newImageDidSelect}
                        success={self._newImageUploadSuccess}
                        uploadProgress={noop}/>
                );
            } else {
                var imageUrl = pathUtils.getAwardImageUri(self.props.award.image);
                return (
                    <img className="img-responsive" src={imageUrl}/>
                );
            }
        }

        return (
            <li className="awards-item">
                <div className="row">
                    <div className="col-md-2">
                        {image}
                    </div>
                    <div className="col-md-8">
                        {content}
                        {autoContent}
                    </div>
                    <div className="col-md-2">
                        <div className="pull-right item-controls">{controls}</div>
                    </div>
                </div>
            </li>
        );
    },
    
     _toggleAutoAwardForm: function () {
        if(this.state.autoAwardForm) {
            this.setState({
                autoAwardForm: !this.state.autoAwardForm,
                type         : '',
                cond         : '',
                condval      : '',
                reason       : '',
                limit        : '',
                userLimit    : ''  
            });
        } else {
            this.setState({
                autoAwardForm: !this.state.autoAwardForm
            });
        }
    },
    
    _cancel: function () {
        this.replaceState(this.getInitialState());
        this.props.itemWillCancel();
    },

    _deleteItem: function () {
        var self = this;
        bootbox.confirm({
            size    : 'small',
            title   : 'Attention: Award Deletion',
            message : 'You are going to delete Award. Are you sure?',
            callback: function (result) {
                if (result) {
                    Actions.deleteAward(self.props.award);
                }
            }
        })
    },

    _descriptionDidChange: function (e) {
        this.setState({
            desc: e.currentTarget.value
        });
    },

    _nameDidChange: function (e) {
        this.setState({
            name: e.currentTarget.value
        });
    },
    
    _typeDidChange: function (e) {
        this.setState({
            type: e.currentTarget.value
        });
    },
    
     _conditionDidChange: function (e) {
        this.setState({
            cond: e.currentTarget.value
        });
    },
    
     _condvalDidChange: function (e) {
        this.setState({
            condval: e.currentTarget.value
        });
    },
    
     _reasonDidChange: function (e) {
        this.setState({
            reason: e.currentTarget.value
        });
    },
    
    _limitDidChange: function (e) {
        this.setState({
            userLimit: e.currentTarget.value
        });
    },
    
    _userLimitDidChange: function (e) {
        this.setState({
            limit: e.currentTarget.value
        });
    },

    _newImageDidSelect: function (file, dataUrl) {
        this.setState({
            dataUrl: dataUrl
        });
    },

    _newImageUploadSuccess: function (fileClient, fileServer) {
        this.setState({
            fileClient: fileClient,
            fileServer: fileServer
        });
    },

    //TODO add userLimit
    _isValid: function () {
        return (this.state.name && this.state.name !== this.props.award.name)
            || (this.state.desc && this.state.desc !== this.props.award.desc)
            || (this.state.autoAwardForm && this.state.type && this.state.cond && this.state.condval && this.state.reason && this.state.limit && 
                    (this.state.type !== this.props.award.type       || 
                     this.state.cond !== this.props.award.cond       || 
                     this.state.condval !== this.props.award.condval ||
                     this.state.reason !== this.props.award.reason ||  
                     this.state.limit !== this.props.award.limit)     )
            || (!this.state.autoAwardForm && !this.state.type && !this.state.cond && !this.state.condval && !this.state.limit && this.state.type !== this.props.award.type)
            || this.state.fileServer;
    },

    _resetImage: function () {
        this.setState({
            initImage: '',
            dataUrl  : ''
        })
    },

    _save: function () {
        if (this._isValid()) {
            this.props.itemWillSave(this.state.name, this.state.desc, this.state.fileServer, this.state.type, this.state.cond, this.state.condval, this.state.reason, this.state.limit, this.state.userLimit);
        }
    }
});

module.exports = AwardsListItemView;
