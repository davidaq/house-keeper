import 'UI/Center';
import 'Model/FormContext';
import 'ajax';
import 'auth';
import './Style';

class Login extends React.Component {
    componentWillMount() {
        this.loginForm = new FormContext().bind(this);
        auth.update().then(() => auth.isLoggedIn && document.location.replace('#/'));
    }
    render() {
        return <Center percent={70} className={Style}>
            <div className="col-sm-0 col-md-3 col-lg-4"/>
            <div className="col-sm-12 col-md-6 col-lg-4">
                <div className="house"/>
                <input type="password" className="form-control" placeholder="Password" {...this.loginForm.mixin('password')}/>
                <br/>
                {this.loginForm.alert('password')}
                <button onClick={this.login} className="btn btn-block btn-primary">Login</button>
            </div>
        </Center>
    }
    login() {
        if (!this.loginForm.value.password)
            return this.loginForm.setError('password', {type:'warning', message:['Warning!','Empty password not allowed']});
        ajax('check-login', {password:this.loginForm.value.password})
            .then(result => {
                auth.update().then(() => document.location.replace('#/'));
            })
            .catch(error => {
                this.loginForm.setError('password', error);
            });
    }
}