// LogSystem.js
export class BattleLog {
    static logs = [];

    static write(message) {
        this.logs.push(message);
    }

    static getLogs() {
        return this.logs.join('\n');;
    }

    static clear() {
        this.logs = [];
    }
}
