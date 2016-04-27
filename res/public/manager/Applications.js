import 'Model/FormContext';
import 'ajax';
import {Input, Group} from 'UI/Form';

class Applications extends React.Component {
    static active = 'applications'
    componentWillMount() {
        this.setState({addType:'git'});
        this.addNewForm = new FormContext({git:{},proxy:{}}).bind(this);
        this.refresh();
    }
    render() {
        return <div className="container-fluid">
            <div className="card form-horizontal" style={{padding:5}}>
                <ul className="nav nav-tabs">
                    <li className={{active:this.state.addType == 'git'}}><a onClick={() => this.setState({addType:'git'})}>Git</a></li>
                    <li className={{active:this.state.addType == 'proxy'}}><a onClick={() => this.setState({addType:'proxy'})}>Backend server</a></li>
                </ul>
                <br/>
                <Cases of={this.state.addType}>
                    <div if="git">
                        <div className="well">
                            The run script should be a vaild NodeJS runnable JS file, and will be run in a dedicated directory rather than the project folder. <br/>
                            Command line arguments will be passed as " --port &lt;random number&gt; [--first_install] [--after-update]",
                            and a HTTP <i><b>(Not HTTPS)</b></i> server is expected to start on the given port. <br/>
                            <b>Pls Note:</b> Do not implement daemonize yourself, the run script is expected to live along with the HTTP server.
                        </div>
                        <Group>
                            <Input ctx={this.addNewForm} name="name">Name</Input>
                        </Group>
                        <Group>
                            <Input ctx={this.addNewForm} name="git.repo" full>Repo url</Input>
                        </Group>
                        <Group>
                            <Input defaultValue="master" ctx={this.addNewForm} name="git.branch">Branch</Input>
                            <Input defaultValue="index.js" ctx={this.addNewForm} name="git.run">Run script</Input>
                        </Group>
                    </div>
                    <div if="proxy">
                        <div className="well">
                            Backend servers are expected to be HTTP servers as described in their configuration
                            (<i>avoid using HTTPS backend servers as they may not work properly due to SSL certificate issues</i>).<br/>
                            Multiple base url address may be seperated with "<b>;</b>", the application will act as a load balancer.
                            You may provide the cookie name your server is using to implement session so that requests from the same client will go to the same server.
                        </div>
                        <Group>
                            <Input ctx={this.addNewForm} name="name">Name</Input>
                        </Group>
                        <Group>
                            <Input placeholder='e.g. "http://127.0.0.1/" or "https://192.168.100.1:8080/myapp/"' full ctx={this.addNewForm} name="proxy.url">Base urls</Input>
                        </Group>
                        <Group>
                            <Input placeholder="<Pass through>" ctx={this.addNewForm} name="proxy.hostname">Host name</Input>
                            <Input placeholder="<Stateless>" ctx={this.addNewForm} name="proxy.cookie">Session cookie</Input>
                        </Group>
                    </div>
                </Cases>
                {this.addNewForm.alert('general')}
                <Cases>
                    <a className="btn btn-primary btn-block disabled" if={this.state.adding}>Adding...</a>
                    <a className="btn btn-primary btn-block" onClick={this.addNew}>Add new application</a>
                </Cases>
            </div>
            <Cases>
                <div className="loading" if={this.state.loading}/>
                <For each="item" index="index" of={this.state.list}>
                    <div className="card" style={{padding:5}} key={item._id}>
                        <div>
                            <Cases of={item.type}>
                                <i className="glyphicon glyphicon-cloud-download" if="git"/>
                                <i className="glyphicon glyphicon-retweet" if="proxy"/>
                            </Cases>
                            &nbsp;
                            <strong style={{fontSize:'1.3em'}}>{item.name}</strong>
                            <i style={{float:'right'}}><small style={{color:'#777'}}>
                                {({git:'Git repo','proxy':'Backend server'})[item.type]}
                                &nbsp;-&nbsp;
                                {item._id}
                            </small></i>
                        </div>
                        <Cases of={item.type}>
                            <div if="git" className="row">
                                <div className="col-sm-12">
                                    <label>Repo url:</label> {item.repo}
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <label>Branch:</label> {item.branch}
                                </div>
                                <div className="col-md-6 col-lg-4">
                                    <label>Run Script:</label> {item.run}
                                </div>
                            </div>
                            <div if="proxy" className="row">
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
                        <div className="btn-group">
                            <Uninstall onClick={() => this.remove(index)}/>
                            <a className="btn btn-primary" if={item.type == 'git'}>Update</a>
                        </div>
                    </div>
                </For>
            </Cases>
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
        } else if (req.type == 'proxy') {
            if (!req.url)
                this.addNewForm.setError('proxy.url', 'Base url is not optional');
            if (this.addNewForm.hasError())
                return;
        }
        this.setState({adding:true});
        ajax('add-application', req).then(result => {
            this.addNewForm.value = {git:{},proxy:{}};
            this.setState({adding:false});
            this.refresh();
        }).catch(err => {
            this.setState({adding:false});
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