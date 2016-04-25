
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

export function Select(props) {
    var {children, ctx, name, defaultValue, ...other} = props;
    if (!defaultValue) {
        if (Array.isArray(props.options)) {
            defaultValue = props.options[0];
        } else {
            for (var k in props.options) {
                defaultValue = k;
                break;
            }
        }
    }
    return <span>
        <label className="col-sm-2 control-label">{children}</label>
        <div className={{"col-sm-4":!props.full,"col-sm-10":props.full}}>
            <select className="form-control" {...other} {...ctx.mixin(name, defaultValue)}>
                <Cases>
                    <For each="option" of={props.options} if={Array.isArray(props.options)}>
                        <option key={option} value={option}>{option}</option>
                    </For>
                    <For each="option" of={Object.keys(props.options)}>
                        <option key={option} value={option}>{props.options[option]}</option>
                    </For>
                </Cases>
            </select>
            {ctx.alert(name)}
        </div>
    </span>
}