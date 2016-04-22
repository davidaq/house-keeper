
function Center(props) {
    var {children, style, percent, ...propsVal} = props;
    style = style || {};
    style.marginLeft = style.marginLeft || 'auto';
    style.marginRight = style.marginRight || 'auto';
    percent = percent || 100;
    return <div style={{display:'table', height:percent + '%', width:'100%'}}>
        <div style={{display:'table-cell', verticalAlign:'middle'}}>
            <div style={style} {...propsVal}>
                {children}
            </div>
        </div>
    </div>
}