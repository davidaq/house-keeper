
function BreadCrumb (props) {
    return <div className="alert alert-info" style={{padding:5}}>
        <For each="item" index="i" of={props.children}>
            <span if={i > 0} style={{padding:'0 0.5em'}}>/</span>
            {item}
        </For>
    </div>
}