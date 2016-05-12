import 'Model/FormContext';
import 'ajax';
import {Input, Group} from 'UI/Form';
import {prompt} from 'UI/Modal';

class Applications extends React.Component {
    static active = 'applications'
    componentWillMount() {
        this.setState({addType:'git', status:{}});
        this.addNewForm = new FormContext({git:{},proxy:{}}).bind(this);
        this.refresh();
        var loadingStatus = false;
        const loadStatus = () => {
            if (loadingStatus)
                return;
            loadingStatus = true;
            ajax('get-application-status').then(result => {
                if (this.statusInterval) {
                    loadingStatus = false;
                    this.setState({status:result});                    
                }
            }).catch(() => loadingStatus = false);
        };
        loadStatus();
        this.statusInterval = setInterval(loadStatus, 3000);
    }
    componentWillUnmount() {
        clearInterval(this.statusInterval);
        this.statusInterval = null;
    }
    render() {
        const now = new Date().getTime();
        return <div className="container-fluid">
            <Cases>
                <div className="loading" if={this.state.loading}/>
                <For each="item" index="index" of={this.state.list}>
                    <div className="card" style={{padding:5}} key={item._id}>
                        <div>
                            <Cases of={item.type}>
                                <i className="glyphicon glyphicon-cloud-download" if="git"/>
                                <i className="glyphicon glyphicon-cloud-download" if="svn"/>
                                <i className="glyphicon glyphicon-retweet" if="proxy"/>
                            </Cases>
                            &nbsp;
                            <strong style={{fontSize:'1.3em'}}>{item.name}</strong>
                            <i style={{float:'right'}}><small style={{color:'#777'}}>
                                {({git:'Git repo',svn:'SVN repo',proxy:'Backend server'})[item.type]}
                                &nbsp;-&nbsp;
                                {item._id}
                            </small></i>
                        </div>
                        <Cases of={item.type}>
                            <Cases if="git">
                                <div if={item._modify} className="form-horizontal">
                                    <Group>
                                        <label className="col-sm-2 control-label">Repo url</label>
                                        <div className="col-sm-4">
                                            <input className="form-control" value={item.repo}/>
                                        </div>
                                        <Input ctx={item._modify} name="branch">Branch</Input>
                                    </Group>
                                    <Group>
                                        <Input ctx={item._modify} placeholder="serve static" name="run">Run script</Input>
                                        <Input ctx={item._modify} name="args">Extra args</Input>
                                    </Group>
                                </div>
                                <div className="row">
                                    <div className="col-md-9 col-lg-8">
                                        <label>Repo url:</label> {item.repo}
                                    </div>
                                    <div className="col-md-3 col-lg-4">
                                        <label>Branch:</label> {item.branch}
                                    </div>
                                    <div className="col-md-6 col-lg-4">
                                        <label>Run Script:</label> {item.run || <i>Serve Static</i>}
                                    </div>
                                    <div className="col-md-6 col-lg-8">
                                        <label>Extra args:</label> {item.args}
                                    </div>
                                    <div className="col-md-12 col-lg-6">
                                        <label>Status:</label> {this.state.status[item._id] || <i>...</i>}
                                    </div>
                                </div>
                            </Cases>
                            <Cases if="svn">
                                <div if={item._modify} className="form-horizontal">
                                    <Group>
                                        <label className="col-sm-2 control-label">Branch url</label>
                                        <div className="col-sm-10">
                                            <input className="form-control" value={item.repo}/>
                                        </div>
                                    </Group>
                                    <Group>
                                        <Input ctx={item._modify} placeholder="serve static" name="run">Run script</Input>
                                        <Input ctx={item._modify} name="args">Extra args</Input>
                                    </Group>
                                    <Group>
                                        <Input ctx={item._modify} name="username">Username</Input>
                                        <Input ctx={item._modify} name="password" type="password">Password</Input>
                                    </Group>
                                </div>
                                <div className="row">
                                    <div className="col-md-12">
                                        <label>Branch url:</label> {item.repo}
                                    </div>
                                    <div className="col-md-6 col-lg-4">
                                        <label>Run Script:</label> {item.run || <i>Serve Static</i>}
                                    </div>
                                    <div className="col-md-6 col-lg-8">
                                        <label>Extra args:</label> {item.args}
                                    </div>
                                    <div className="col-md-12 col-lg-6">
                                        <label>Status:</label> {this.state.status[item._id] || <i>...</i>}
                                    </div>
                                </div>
                            </Cases>
                            <Cases if="proxy">
                                <div if={item._modify} className="form-horizontal">
                                    <Group>
                                        <Input ctx={item._modify} name="url" full>Base urls</Input>
                                    </Group>
                                    <Group>
                                        <Input placeholder="<Pass through>" ctx={item._modify} name="hostname">Host name</Input>
                                        <Input placeholder="<Stateless>" ctx={item._modify} name="cookie">Session cookie</Input>
                                    </Group>
                                </div>
                                <div className="row">
                                    <div className="col-sm-12">
                                        <label>Base urls:</label> {item.url}
                                    </div>
                                    <div className="col-md-6 col-lg-4">
                                        <label>Host name:</label> {item.hostname || <i>Pass through</i>}
                                    </div>
                                    <div className="col-md-6 col-lg-4">
                                        <label>Session cookie:</label> {item.cookie || <i>Stateless</i>}
                                    </div>
                                </div>
                            </Cases>
                        </Cases>
                        <Cases>
                            <div if={item._modify} className="btn-group">
                                <a className="btn btn-primary" onClick={() => this.saveModify(item)}>Save</a>
                                <a className="btn btn-default" onClick={() => this.cancelModify(item)}>Cancel</a>
                            </div>
                            <div className="row" style={{padding:0, margin:0}}>
                                <div className="btn-group pull-left">
                                    <Cases if={item.type == 'git' || item.type == 'svn'}>
                                        <a className="btn btn-primary disabled" if={now - (item._lastUpdate || 0) < 3000}>Fetch Update</a>
                                        <a className="btn btn-primary" onClick={() => this.update(item)}>Fetch Update</a>
                                    </Cases>
                                    <Cases>
                                        <a className="btn btn-default disabled" if={now - (item._lastUpdate || 0) < 3000}>Modify</a>
                                        <a className="btn btn-default" onClick={() => this.modify(item)}>Modify</a>
                                    </Cases>
                                </div>
                                <div className="btn-group pull-right">
                                    <Uninstall onClick={() => this.remove(index)}/>
                                </div>
                            </div>
                        </Cases>
                    </div>
                </For>
            </Cases>
            <div className="card form-horizontal" style={{padding:5, marginTop:'1em'}}>
                <strong style={{ fontSize:'1.2em', marginBottom:'1em', display:'block' }}>
                    Add New Application
                </strong>
                <ul className="nav nav-tabs">
                    <li className={{active:this.state.addType == 'git'}}><a onClick={() => this.setState({addType:'git'})}>Git</a></li>
                    <li className={{active:this.state.addType == 'svn'}}><a onClick={() => this.setState({addType:'svn'})}>SVN</a></li>
                    <li if={false} className={{active:this.state.addType == 'receiver'}}><a onClick={() => this.setState({addType:'receiver'})}>Receiver</a></li>
                    <li className={{active:this.state.addType == 'proxy'}}><a onClick={() => this.setState({addType:'proxy'})}>Backend server</a></li>
                </ul>
                <br/>
                <Cases of={this.state.addType}>
                    <div if="git">
                        <div className="well">
                            The run script will be executed with NodeJS in a <u>dedicated directory</u>, 
                            housekeeper will guard the execution making it to restart when stoped. 
                            Command line arguments will be passed as " --port &lt;random port number&gt; &lt;extra args&gt;",
                            and a HTTP <i><b>(Not HTTPS)</b></i> server listening on the given port is expected to start. <br />
                            Static files will be served if no run script is provided, indicate base directory (relative to repo) through extra args.
                        </div>
                        <Group>
                            <Input ctx={this.addNewForm} name="name">Name</Input>
                        </Group>
                        <Group>
                            <Input ctx={this.addNewForm} name="git.repo">Repo url</Input>
                            <Input defaultValue="master" ctx={this.addNewForm} name="git.branch">Branch</Input>
                        </Group>
                        <Group>
                            <Input placeholder="serve static" ctx={this.addNewForm} name="git.run">Run script</Input>
                            <Input ctx={this.addNewForm} name="git.args">Extra args</Input>
                        </Group>
                    </div>
                    <div if="svn">
                        <div className="well">
                            The run script will be executed with NodeJS in a <u>dedicated directory</u>, 
                            housekeeper will guard the execution making it to restart when stoped. 
                            Command line arguments will be passed as " --port &lt;random port number&gt; &lt;extra args&gt;",
                            and a HTTP <i><b>(Not HTTPS)</b></i> server listening on the given port is expected to start. <br />
                            Static files will be served if no run script is provided, indicate base directory (relative to repo) through extra args.
                        </div>
                        <Group>
                            <Input ctx={this.addNewForm} name="name">Name</Input>
                        </Group>
                        <Group>
                            <Input ctx={this.addNewForm} name="svn.repo" full>Branch url</Input>
                        </Group>
                        <Group>
                            <Input placeholder="serve static" ctx={this.addNewForm} name="svn.run">Run script</Input>
                            <Input ctx={this.addNewForm} name="svn.args">Extra args</Input>
                        </Group>
                        <Group>
                            <Input ctx={this.addNewForm} name="svn.username">Username</Input>
                            <Input ctx={this.addNewForm} name="svn.password" type="password">Password</Input>
                        </Group>
                    </div>
                    <div if="receiver">
                        <div className="well">
                            The run script will be executed with NodeJS in a <u>dedicated directory</u>, 
                            housekeeper will guard the execution making it to restart when stoped. 
                            Command line arguments will be passed as " --port &lt;random port number&gt; &lt;extra args&gt;",
                            and a HTTP <i><b>(Not HTTPS)</b></i> server listening on the given port is expected to start. <br />
                            Static files will be served if no run script is provided, indicate base directory (relative to repo) through extra args.
                        </div>
                        <Group>
                            <Input ctx={this.addNewForm} name="name">Name</Input>
                        </Group>
                        <Group>
                            <Input placeholder="serve static" ctx={this.addNewForm} name="receiver.run">Run script</Input>
                            <Input ctx={this.addNewForm} name="receiver.args">Extra args</Input>
                        </Group>
                    </div>
                    <div if="proxy">
                        <div className="well">
                            Backend servers are expected to be HTTP servers as described in their configuration
                            (<i>avoid using HTTPS backend servers as they may not work properly due to SSL certificate issues</i>).<br/>
                            Multiple base url address may be seperated with "<b>;</b>", the application will act as a naive load balancer,
                            forwarding requests to random backend. 
                            Use nginx or haproxy instead if you're expecting a professional feature complete load balancer.
                        </div>
                        <Group>
                            <Input ctx={this.addNewForm} name="name">Name</Input>
                        </Group>
                        <Group>
                            <Input placeholder='e.g. "http://127.0.0.1/" or "https://192.168.100.1:8080/myapp/"' full ctx={this.addNewForm} name="proxy.url">Base urls</Input>
                        </Group>
                        <Group>
                            <Input placeholder="<Pass through>" ctx={this.addNewForm} name="proxy.hostname">Host name</Input>
                        </Group>
                    </div>
                </Cases>
                {this.addNewForm.alert('general')}
                <Cases>
                    <a className="btn btn-primary btn-block disabled" if={this.state.adding}>Adding...</a>
                    <a className="btn btn-primary btn-block" onClick={this.addNew}>
                        <i className="glyphicon glyphicon-plus" />
                        &nbsp;
                        Submit
                    </a>
                </Cases>
            </div>
        </div>
    }
    addNew() {
        this.addNewForm.errors = {};
        var req;
        req = this.addNewForm.value[this.state.addType];
        req.type = this.state.addType;
        req.name = this.addNewForm.value.name;
        if (!req.name)
            this.addNewForm.setError('name', 'Name is not optional');
        if (req.type == 'git') {
            if (!req.repo)
                this.addNewForm.setError('git.repo', 'Repo url is not optional');
            if (this.addNewForm.hasError())
                return;
            req.branch = req.branch || 'master';
        } else if (req.type == 'svn') {
            if (!req.repo)
                this.addNewForm.setError('svn.repo', 'Branch url is not optional');
            if (this.addNewForm.hasError())
                return;
        } else if (req.type == 'proxy') {
            if (!req.url)
                this.addNewForm.setError('proxy.url', 'Base url is not optional');
            if (this.addNewForm.hasError())
                return;
        }
        this.setState({adding:true});
        ajax('add-application', req).then(result => {
            this.addNewForm.value = { git:{}, proxy:{} };
            this.setState({ adding: false });
            this.refresh();
        }).catch(err => {
            this.setState({ adding: false });
            this.addNewForm.setError('general', err);
        });
    }
    remove(index) {
        var item = this.state.list[index];
        if (item) {
            this.state.list.splice(index, 1);
            ajax('remove-application', {name:item.name, _id:item._id})
                .then(r => {
                    this.refresh();
                });
        }
    }
    refresh() {
        this.setState({loading:true});
        ajax('get-application', {}).then(apps => {
            var list = [];
            for (var k of Object.keys(apps).sort()) {
                list.push(apps[k]);
            }
            this.setState({loading:false, list});
        });
    }
    update(item) {
        item._lastUpdate = new Date().getTime();
        this.forceUpdate();
        ajax('update-application', {name:item.name});
    }
    modify(item) {
        var init = {};
        for (var k in item) {
            if (k.substr(0, 1) != '_') {
                init[k] = item[k];
            }
        }
        item._modify = new FormContext(init).bind(this);
        this.forceUpdate();
    }
    saveModify(item) {
        ajax('update-application', item._modify.value);
        for (var k in item._modify.value) {
            if (k.substr(0, 1) != '_') {
                item[k] = item._modify.value[k];
            }
        }
        delete item._modify;
        item._lastUpdate = new Date().getTime();
        this.forceUpdate();
    }
    cancelModify(item) {
        delete item._modify;
        this.forceUpdate();
    }
}

class Uninstall extends React.Component {
    componentWillMount() {
        this.setState({state:'rest'})
    }
    render() {
        return <Cases of={this.state.state}>
            <a className="btn btn-danger" onClick={this.firstClick} if="rest">Uninstall</a>
            <a className="btn btn-warning disabled" if="delay">Yes I'm serious</a>
            <a className="btn btn-warning" onClick={this.confirmed} if="active">Yes I'm serious</a>
            <a className="btn btn-info disabled" if="confirmed">Please wait</a>
        </Cases>
    }
    firstClick() {
        this.setState({state:'delay'});
        setTimeout(() => this.setState({state:'active'}), 700);
        this.rDelay = setTimeout(() => this.setState({state:'rest'}), 3000);
    }
    confirmed() {
        clearTimeout(this.rDelay);
        this.setState({state:'confirmed'});
        this.props.onClick && this.props.onClick({target:this});
    }
}