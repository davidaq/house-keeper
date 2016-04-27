import 'ajax';
import 'Model/FormContext';
import {Input, Textarea, Group} from 'UI/Form';

class Settings extends React.Component {
    static active = 'settings'
    componentWillMount() {
        this.setState({loading:true});
        ajax('get-settings').then(settings => {
            this.settingsForm = new FormContext(settings).bind(this);
            this.setState({loading:false});
        }).catch(error => {
            this.setState({loading:false, error});
        });
    }
    render() {
        return <div>
            <Cases>
                <div className="loading" if={this.state.loading}/>
                <div className="alert alert-danger" if={this.state.error}>
                    {this.state.error}
                </div>
                <div className="card form-horizontal" style={{padding:5}}>
                    <label>Manager Settings</label>
                    <Group>
                        <Input ctx={this.settingsForm} name="manager.port">Port</Input>
                        <Input type="password" placeholder="Keep unchanged" ctx={this.settingsForm} name="manager.password">Password</Input>
                    </Group>
                    <div className="alert alert-info">
                        <b>Tip.</b> The manager will be served through HTTPS if SSL settings exists.
                    </div>
                    <label>Server Settings</label>
                    <Group>
                        <Input placeholder="Leave blank to disable" ctx={this.settingsForm} name="server.http_port">HTTP Port</Input>
                        <Input ctx={this.settingsForm} name="server.https_port">HTTPS Port</Input>
                    </Group>
                    <div className="alert alert-info">
                        <b>Tip.</b> HTTPS won't be available if SSL settings are not set.
                    </div>
                    <label>SSL Settings</label>
                    <Group>
                        <Textarea rows={4} full ctx={this.settingsForm} name="ssl.key">Key</Textarea>
                    </Group>
                    <Group>
                        <Textarea rows={4} full ctx={this.settingsForm} name="ssl.crt">Certificate</Textarea>
                    </Group>
                    <Cases>
                        <a className="btn btn-primary btn-block disabled" if={this.state.saving}>Please wait</a>
                        <a className="btn btn-primary btn-block" onClick={this.save}>Save and restart</a>
                    </Cases>
                </div>
            </Cases>
            <br/>
            <div className="alert alert-warning">
                <b>Beware!</b> Housekeeper will restart when saving the changes and service will become unvailable for a while. <br/>
                The page will refresh automatically after about 3 seconds when successfully saved, try reloading manuelly if page failed to load.
            </div>
        </div>
    }
    save() {
        var val = this.settingsForm.value;
        var redirect = ((val.ssl.key && val.ssl.crt) ? 'https' : 'http') + '://' + document.location.hostname + ':' + val.manager.port + '/#/settings';
        this.setState({saving:true});
        ajax('set-settings', val).then(r => {
            setInterval(() => {
                document.location.replace(redirect);
            }, 3000);
        }).catch(e => {
            for (var k in e) {
                this.settingsForm.setError(k, e[k]);
            }
            this.setState({saving:false});
        });
    }
}