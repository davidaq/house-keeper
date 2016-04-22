import './ajax';

var auth = BoundObject.create({
    isLoggedIn: false,
    update() {
        return ajax('check-login').then(r => {
            auth.isLoggedIn = r;
            return auth;
        });
    }
});
