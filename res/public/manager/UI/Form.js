
export function Group(props) {
    return <div className="form-group">{props.children}</div>
}

export function Input(props) {
    var {children, ctx, name, defaultValue, ...other} = props;
    return <span>
        <label className="col-sm-2 control-label">{children}</label>
        <div className={{"col-sm-4":!props.full,"col-sm-10":props.full}}>
            <input className="form-control" {...other} {...ctx.mixin(name, defaultValue)}/>
            {ctx.alert(name)}
        </div>
    </span>
}

export function Textarea(props) {
    var {children, ctx, name, defaultValue, ...other} = props;
    return <span>
        <label className="col-sm-2 control-label">{children}</label>
        <div className={{"col-sm-4":!props.full,"col-sm-10":props.full}}>
            <textarea className="form-control" {...other} {...ctx.mixin(name, defaultValue)}/>
            {ctx.alert(name)}
        </div>
    </span>
}