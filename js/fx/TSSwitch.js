function TSSwitch(cases) {
    this.cases = cases;
    this.defaultCase = this._findDefaultCase(cases);
    this.dependents = Object.keys(this.cases.reduce(function (ac, cr) {
        if (typeof cr.case === 'object'){
            Object.assign(ac, cr);
        }
        return ac;
    }, {}));
}

TSSwitch.prototype._findDefaultCase = function (cases) {
    for (var i = 0; i < cases.length; ++i) {
        if (this.cases[i].case === 'DEFAULT') return this.cases[i];
    }
    return null;
}


TSSwitch.prototype.getCase = function (caseObj) {
    var cCase;
    var cases = this.cases;
    for (var i = 0; i < cases.length; ++i) {
        cCase = cases[i];
        if (this._test(cCase, caseObj)) return cCase;
    }
    return this.defaultCase;
};


TSSwitch.prototype._test = function (caseRq, case2Test) {
    if (case2Test === 'DEFAULT') return false;
    return Object.keys(caseRq).every(function (key) {
        return caseRq[key] === case2Test[key];
    });
};

export default TSSwitch;