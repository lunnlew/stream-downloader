"use strict";

global.Buffer = global.Buffer || require('buffer').Buffer;

if (typeof btoa === 'undefined') {
    global.btoa = function(str) {
        return new Buffer(str).toString('base64');
    };
}

if (typeof atob === 'undefined') {
    global.atob = function(b64Encoded) {
        return new Buffer(b64Encoded, 'base64').toString();
    };
}



var i, s, r, n, a, e;
i ? function() {
    var e = i.crypto || i.msCrypto;
    if (!s && e && e.getRandomValues)
        try {
            var t = new Uint8Array(16);
            a = s = function() {
                    return e.getRandomValues(t),
                        t
                },
                s()
        } catch (o) {}
    if (!s) {
        var n = new Array(16);
        r = s = function() {
                for (var e, t = 0; t < 16; t++)
                    0 == (3 & t) && (e = 4294967296 * Math.random()),
                    n[t] = e >>> ((3 & t) << 3) & 255;
                return n
            },
            "undefined" != typeof console && console.warn && console.warn("[SECURITY] node-uuid: crypto not usable, falling back to insecure Math.random()")
    }
}() : function() {
    if ("function" == typeof require)
        try {
            var e = require("crypto").randomBytes;
            n = s = e && function() {
                    return e(16)
                },
                s()
        } catch (t) {}
}();
for (var c = "function" == typeof Buffer ? Buffer : Array, d = [], u = {}, t = 0; t < 256; t++)
    d[t] = (t + 256).toString(16).substr(1),
    u[d[t]] = t;

function h(e, t) {
    var n = t || 0,
        o = d;
    return o[e[n++]] + o[e[n++]] + o[e[n++]] + o[e[n++]] + "-" + o[e[n++]] + o[e[n++]] + "-" + o[e[n++]] + o[e[n++]] + "-" + o[e[n++]] + o[e[n++]] + "-" + o[e[n++]] + o[e[n++]] + o[e[n++]] + o[e[n++]] + o[e[n++]] + o[e[n++]]
}
var o = s(),
    f = [1 | o[0], o[1], o[2], o[3], o[4], o[5]],
    p = 16383 & (o[6] << 8 | o[7]),
    w = 0,
    v = 0;

function l(e, t, n) {
    var o = t && n || 0;
    "string" == typeof e && (t = "binary" === e ? new c(16) : null,
        e = null);
    var i = (e = e || {}).random || (e.rng || s)();
    if (i[6] = 15 & i[6] | 64,
        i[8] = 63 & i[8] | 128,
        t)
        for (var r = 0; r < 16; r++)
            t[o + r] = i[r];
    return t || h(i)
}
var g = l;
g.v1 = function(e, t, n) {
        var o = t && n || 0,
            i = t || [],
            r = null != (e = e || {}).clockseq ? e.clockseq : p,
            s = null != e.msecs ? e.msecs : (new Date).getTime(),
            a = null != e.nsecs ? e.nsecs : v + 1,
            c = s - w + (a - v) / 1e4;
        if (c < 0 && null == e.clockseq && (r = r + 1 & 16383),
            (c < 0 || w < s) && null == e.nsecs && (a = 0),
            1e4 <= a)
            throw new Error("uuid.v1(): Can't create more than 10M uuids/sec");
        w = s,
            p = r;
        var d = (1e4 * (268435455 & (s += 122192928e5)) + (v = a)) % 4294967296;
        i[o++] = d >>> 24 & 255,
            i[o++] = d >>> 16 & 255,
            i[o++] = d >>> 8 & 255,
            i[o++] = 255 & d;
        var u = s / 4294967296 * 1e4 & 268435455;
        i[o++] = u >>> 8 & 255,
            i[o++] = 255 & u,
            i[o++] = u >>> 24 & 15 | 16,
            i[o++] = u >>> 16 & 255,
            i[o++] = r >>> 8 | 128,
            i[o++] = 255 & r;
        for (var l = e.node || f, g = 0; g < 6; g++)
            i[o + g] = l[g];
        return t || h(i)
    },
    g.v4 = l,
    g.parse = function(e, t, n) {
        var o = t && n || 0,
            i = 0;
        for (t = t || [],
            e.toLowerCase().replace(/[0-9a-f]{2}/g, function(e) {
                i < 16 && (t[o + i++] = u[e])
            }); i < 16;)
            t[o + i++] = 0;
        return t
    },
    g.unparse = h,
    g.BufferClass = c,
    g._rng = s,
    g._mathRNG = r,
    g._nodeRNG = n,
    g._whatwgRNG = a,
    "undefined" != typeof module && module.exports ? module.exports = g : "function" == typeof define && define.amd ? define(function() {
        return g
    }) : (e = i.uuid,
        g.noConflict = function() {
            return i.uuid = e,
                g
        },
        i.honeyUuid = g)