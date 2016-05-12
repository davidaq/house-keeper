
export function prompt(title, ui) {
	var promise = new Promise(resolve => {
		var mountPoint = document.createElement('div');
		$('body').append(mountPoint);
		ReactDOM.render(<ModalBox title={title} ui={ui} mount={mountPoint} resolve={resolve} />, mountPoint);
	});
}

class ModalBox extends React.Component {
	componentWillMount() {
		this.props.mount.className = 'modal fade';
	}
	componentDidMount() {
		$(this.props.mount).modal('show');
	}
	render() {
		return (
			<div className="modal-dialog">
				<div className="modal-content">
					<div className="modal-header">
						<button type="button" className="close" onClick={this.cancel}><span>&times;</span></button>
						<h4 className="modal-title">{this.props.title}</h4>
					</div>
					<div className="modal-body">
						{this.props.ui}
					</div>
					<div className="modal-footer">
				        <button type="button" className="btn btn-default" onClick={this.cancel}>Cancel</button>
				        <button type="button" className="btn btn-primary" onClick={this.submit}>Submit</button>
					</div>
				</div>
			</div>
		)
	}
	cancel() {
		this.props.reject && this.props.reject('cancel');
		this.dismiss();
	}
	submit() {
		$(this.props.mount).modal('hide');
		this.dismiss();
	}
	dismiss() {
		$(this.props.mount).modal('hide');
		setTimeout(() => {
			ReactDOM.unmountComponentAtNode(this.props.mount);
			$(this.props.mount).remove();
		}, 500);
	}
}