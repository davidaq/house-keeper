import 'Model/FormContext';
import 'ajax';

class Home extends React.Component {
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
                        <Group>
                            <Input ctx={this.addNewForm} name="name">Name</Input>
                        </Group>
                        <Group>
                            <Input ctx={this.addNewForm} name="git.repo">Repo url</Input>
                            <Input placeholder="master" ctx={this.addNewForm} name="git.branch">Branch</Input>
                        </Group>
                    </div>
                    <div if="proxy">
                        <Group>
                            <Input ctx={this.addNewForm} name="name">Name</Input>
                        </Group>
                        <Group>
                            <Input ctx={this.addNewForm} name="proxy.address">Address</Input>
                            <Input placeholder="80" ctx={this.addNewForm} name="proxy.port">Port</Input>
                        </Group>
                        <Group>
                            <Input placeholder="<same as address>" ctx={this.addNewForm} name="proxy.hostname">Host name</Input>
                            <Input placeholder="/" ctx={this.addNewForm} name="proxy.path">Target path</Input>
                        </Group>
                    </div>
                </Cases>
                {this.addNewForm.alert('general')}
                <Cases>
                    <a className="btn btn-primary btn-block disabled" if={this.state.adding}>Adding...</a>
                    <a className="btn btn-primary btn-block" onClick={this.addNew}>Add new application</a>
                </Cases>
            </div>
            <div className="loading" if={this.state.loading}/>
        </div>
    }
    addNew() {
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
            if (!req.address)
                this.addNewForm.setError('proxy.address', 'Address is not optional');
            if (req.port && (!isFinite(req.port) || req.port < 1 || req.port > 65534))
                this.addNewForm.setError('proxy.port', 'Port is not valid');
            if (this.addNewForm.hasError())
                return;
            req.port = req.port - 0 || 80;
            req.hostname = req.hostname || req.address;
            req.path = req.path || '/';
        }
        this.addNewForm.value = {git:{},proxy:{}};
        this.setState({adding:true});
        ajax('add-application', req).then(result => {
            this.setState({adding:false});
            this.refresh();
        }).catch(err => {
            this.setState({adding:false});
            this.addNewForm.setError('general', err);
        });
    }
    refresh() {
        this.setState({loading:false});
    }
}

function Group(props) {
    return <div className="form-group">{props.children}</div>
}

function Input(props) {
    var {children, ctx, name, ...other} = props;
    return <span>
        <label className="col-sm-2 control-label">{children}</label>
        <div className="col-sm-4">
            <input className="form-control" {...other} {...ctx.mixin(name)}/>
            {ctx.alert(name)}
        </div>
    </span>
}