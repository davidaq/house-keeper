import {Router, Route, IndexRoute} from 'ReactRouter';
import './auth';
import './GlobalStyle';
import './Login';
import './NavigateMenu';
import './Home';

var body = document.createElement('div');
$(body).html('Loading...');
$(body).css({height:'100%'});
$('body').append(body);
$('html').addClass(GlobalStyle);

auth.update().then(function() {
    $(body).html('');
    ReactDOM.render(<Router>
        <Route path="/login" component={Login}/>
        <Route path="/" component={NavigateMenu}>
            <IndexRoute component={Home}/>
            <Route path="*" component={Home}/>
        </Route>
    </Router>, body);
});

window.notEmpty = function(obj) {
    if (!obj)
        return false;
    if (Array.isArray(obj)) {
        return obj.length > 0;
    }
    switch(typeof obj) {
    case 'object':
        return Object.keys(obj).length > 0
    case 'string':
    case 'number':
        return !!obj;
    }
    throw new Error('Unable to check emptyness of type ' + (typeof obj));
};

window.forceArray = function(arr) {
    if (!arr)
        return [];
    return Array.isArray(arr) ? arr : [arr];
};