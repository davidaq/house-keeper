import 'ajax';
import './auth';

class NavigateMenu extends React.Component {
    componentWillMount() {
        this.componentWillReceiveProps(this.props);
    }
    componentWillReceiveProps(props) {
        if (!auth.isLoggedIn)
            document.location.replace('#/login');
    }
    render() {
        return <div>
            <a onClick={this.logout}>logout</a>
            {this.props.children}
        </div>
    }
    logout() {
        ajax('logout', {}).then(() => document.location.replace('#/login'));
    }
}