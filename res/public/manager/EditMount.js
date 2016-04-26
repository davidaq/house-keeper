import 'UI/BreadCrumb';
import {Input,Select,Group} from 'UI/Form';
import 'Model/FormContext';
import 'ajax';

class EditMount extends React.Component {
    static active = 'mounts'
    componentWillMount() {
        this.form = new FormContext().bind(this);
        this.state.loading = 2;
        if (this.props.params.id == 'new') {
            this.state.loading--;
        } else {
            ajax('get-mounts', {id:this.props.params.id}).then(r => {
                this.form.value = r;
                this.setState({loading:this.state.loading - 1});
            });
        }
        ajax('get-application', {}).then(apps => {
            var list = Object.keys(apps).sort();
            this.setState({loading:this.state.loading - 1, apps:list});
        });
    }
    render() {
        return <div>
            <BreadCrumb>
                <a href="#/mounts">Mounts</a>
                <Cases>
                    <span if={this.props.params.id == 'new'}>Create new mount</span>
                    <span>Edit mount</span>
                </Cases>
            </BreadCrumb>
            <Cases>
                <div className="loading" if={this.state.loading}/>
                <div className="card form-horizontal" style={{padding:10}}>
                    <Group>
                        <Input defaultValue="" placeholder="Blank for any" ctx={this.form} name="domain">Domain</Input>
                        <Input defaultValue="/" ctx={this.form} name="path">Path</Input>
                    </Group>
                    <Group>
                        <Select options={this.state.apps} ctx={this.form} name="app">Application</Select>
                        <Select options={{free:'Allow insecure HTTP',force:'Force HTTPS'}} ctx={this.form} name="secure">Security</Select>
                    </Group>
                    <Cases>
                        <button className="btn btn-primary btn-block disabled" if={this.state.saving}>Please wait...</button>
                        <button className="btn btn-primary btn-block" onClick={this.save}>Save</button>
                    </Cases>
                </div>
            </Cases>
            <br/>
            <div if={this.props.params.id == 'new'} className="alert alert-warning">
                <b>Notice!</b> Do not host too many mounts as routing would impact performance.
            </div>
        </div>
    }
    save() {
        if (!this.form.value.path.match(/^\/(.*\/)?$/)) {
            this.form.setError('path', 'Path must start and end with "/"');
        }
        if (!this.form.value.app) {
            this.form.setError('app', 'Must select one');
        }
        if (!this.form.hasError()) {
            this.setState({saving:true});
            ajax('set-mount', this.form.value).then(r => {
                document.location.replace('#/mounts');
            }).catch(console.log.bind(console));
        }
    }
}