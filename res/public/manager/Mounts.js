import 'ajax';

class Mounts extends React.Component {
    static active = 'mounts'
    componentWillMount() {
        this.refresh();
    }
    render() {
        var prev = {};
        return <Cases>
            <div className="loading" if={this.state.loading}/>
            <div>
                <div className="card" style={{padding:5}}>
                    <div className="btn-group btn-group-justified">
                        <a className="btn btn-primary">Save configuration</a>
                        <a className="btn btn-default" href="#/mounts/new">Create new mount</a>
                    </div>
                </div>
                <br/>
                <div if={!this.state.mounts.length} className="alert alert-success">
                    <b>Hmmm...</b> No mount existing now. Try creating one &#8599;
                </div>
                <For each="item" of={this.state.mounts}>
                    <div className="card" style={{padding:5}} key={item._id}>
                        <div className="row">
                            <div className="col-md-6 col-lg-4">
                                <label>Domain:</label> {item.domain || <i>Any</i>}
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <label>Path:</label> {item.path}
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <label>Application:</label> {item.app}
                            </div>
                            <div className="col-md-6 col-lg-4">
                                <label>Security:</label> {({free:'Allow insecure HTTP',force:'Force HTTPS'})[item.secure]}
                            </div>
                        </div>
                        <div className="alert alert-danger" if={item.sortName == prev.sortName}>
                            <b>Oops!</b> This route won't work because it has the same mount point as the previous one.
                        </div>
                        <div className="btn-group">
                            <Remove onClick={() => this.remove(item._id)}/>
                            <a href={"#/mounts/" + item._id} className="btn btn-primary">Modify</a>
                        </div>
                        {(prev = item) && ''}
                    </div>
                </For>
                <br/>
                <div className="alert alert-info" if={this.state.mounts.length > 1}>
                    <b>Tip.</b> Routing will try to resolve the longest domain and path match. Domains will also match sub-domains.
                </div>
            </div>
        </Cases>
    }
    refresh() {
        this.setState({loading:true});
        ajax('get-mounts').then(mounts => {
            this.setState({loading:false, mounts});
        });
    }
    remove(id) {
        ajax('remove-mount', {id}).then(r => {
            this.refresh();
        });
    }
}

class Remove extends React.Component {
    componentWillMount() {
        this.setState({state:'rest'})
    }
    render() {
        return <Cases of={this.state.state}>
            <a className="btn btn-danger" onClick={this.firstClick} if="rest">Umount</a>
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