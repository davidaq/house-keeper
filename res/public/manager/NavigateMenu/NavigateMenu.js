import 'ajax';
import 'auth';
import './Style';

class NavigateMenu extends React.Component {
    componentWillMount() {
        this.componentWillReceiveProps(this.props);
    }
    componentWillReceiveProps(props) {
        if (!auth.isLoggedIn)
            document.location.replace('#/login');
    }
    render() {
        var active = this.props.children.type.active;
        return <div className={Style}>
            <div className="header">
                <a className="brand" href="#/">Housekeeper</a>
                <a onClick={this.logout}>Logout</a>
            </div>
            <br/>
            <div className="container">
                <div className="row">
                    <div className="col-md-3 col-lg-2">
                        <ul className="sidemenu nav nav-pills nav-stacked">
                            <NavItem active={active}>Applications</NavItem>
                            <NavItem active={active}>Mounts</NavItem>
                            <NavItem active={active}>Settings</NavItem>
                        </ul>
                    </div>
                    <div className="col-md-9 col-lg-10">
                        {this.props.children}
                    </div>
                </div>
            </div>
            <br/><br/>
        </div>
    }
    logout() {
        ajax('logout', {}).then(() => document.location.replace('#/login'));
    }
}

function NavItem(props) {
    var name = props.children;
    if (Array.isArray(name)) {
        name = name[0];
    }
    var lname = name.toLowerCase();
    return <li className={{active:lname == props.active}}><a href={"#/" + lname}>{name}</a></li>;
}