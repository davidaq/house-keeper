const crypto = require('crypto');

module.exports = function(req) {
    if (req.payload.password) {
        var sha1 = crypto.createHash('sha1');
        sha1.write(req.payload.password);
        sha1 = sha1.digest('base64');
        if (sha1 == req.config.password) {
            req.yar.set('login', true);
            return {ok:true};
        } else {
            return {error:req.config.password +'Wrong password!' + sha1};
        }
    }
    return !!req.yar.get('login');
}