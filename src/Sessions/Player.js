class Player {
    constructor(user) {
        this.user = user;
        this.avatar = '';
        this.init();
    }
    init() {
		this.auto = this.user.bot;
        this.active = true;
        this.forfeited = false;
        this.reason = '';
    }
    get username() {
        return this.user.username;
    }
    get id() {
        return this.user.id;
    }
    get bot() {
        return this.user.bot;
    }
    get inactive() {
        return !this.active;
    }
    set inactive(x) {
        this.active = !x;
    }
    toString() {
        return this.username + (this.avatar ? ` (${this.avatar})` : '');
    }
    forfeit(reason) {
        this.forfeited = true;
        this.reason = reason;
    }
}

module.exports = Player;
