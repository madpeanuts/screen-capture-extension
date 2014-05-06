define(['./add-form-generated', './settings-form'], function(GeneratedForm, LoginForm){

    'use strict';

    return React.createClass({

        getInitialState: function() {
            return {
                status: 'ready',
                message: '',
                items: [
                    'bug',
                    'request',
                    'userstory'
                ],
                forms: []
            };
        },

        componentDidMount: function() {

            if (this.props.restApi.isLogged()) {
                this.getForms();
            }

            this.props.restApi.onAuth = function(){
                this.getForms();
            }.bind(this);
        },

        getForms: function() {
            this.props.restApi
            .getForms(this.state.items)
            .then(function(forms){
                forms[0].active = true;
                this.setState({
                    forms: forms
                });
            }.bind(this))
            .done();
        },

        render: function() {

            if (!this.props.restApi.isLogged()) {
                return (<LoginForm restApi={this.props.restApi} />);
            }

            return (
                <div className="row">
                    <div className="col-sm-3 column-selector">
                        <ul className="nav nav-pills nav-stacked">
                            {this.state.forms.map(function(v){
                                return <li key={v.name} className={v.name.toLowerCase() + (v.active ? ' active' : '')}><a href={"#" + v.name} data-toggle="tab">{v.title}</a></li>
                            })}
                        </ul>
                    </div>
                    <div className="tab-content col-sm-9 column-forms">
                        {this.state.forms.map(function(v){
                            return (
                                <div key={v.name} className={"tab-pane " + (v.active ? 'active' : '')} id={v.name}>
                                    <GeneratedForm restApi={this.props.restApi} restId={v.name} paintManager={this.props.paintManager} />
                                </div>
                            )
                        }.bind(this))}
                    </div>
                </div>
            );
        }
    });
});
