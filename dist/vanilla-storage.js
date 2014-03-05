/**
 * Helpers needed in the storage modules
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 */

/**
 * WebSQL adapter - manages a simple table with key/val/timestamp
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 */

/**
 * IndexedDB adapter
 *
 * @see http://www.html5rocks.com/en/tutorials/indexeddb/todo/
 * @see http://net.tutsplus.com/tutorials/javascript-ajax/working-with-indexeddb/
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 */

/**
 * VanillaStorage.js
 *
 * Simple client side storage abstraction
 *
 * This is basically just a wrapper for the different storage backends,
 * exporting a very simple API for CRUDing on the clientside by abstracting
 * the complexity of the multiple storage approaches behind a simple API.
 *
 * TODO check diffs:
 *  - http://labs.ft.com/2012/09/ft-style-web-app-on-firefox-and-ie6-to-ie10/
 *  - PouchDB example: http://jsfiddle.net/828Ng/
 *
 * @author  Michael Wager <mail@mwager.de>
 * @license http://opensource.org/licenses/MIT
 * @version 0.6.0
 */

(function(){(function(){"use strict";var e={ensureCallback:function(e){return typeof e!="function"?function(){}:e},parseKey:function(e){return e=e.replace(/\//g,""),e=e.replace(/[:]/g,""),e=e.replace(/[.]/g,""),e},out:function(){if(!window.console||!console.log)return!1;arguments[0]="[Vanilla LOG] "+arguments[0],console.log.apply(console,arguments)}};typeof define=="function"&&define.amd?define("storageHelpers",[],function(){return e}):window.storageHelpers=e})(),function(){"use strict";function e(e){var t=e.ensureCallback,n=e.parseKey,r=e.out,i=function(e){if(!this.isValid())return!1;e||(e={});var t=e.storeName,n=e.version;this.db=null,this.DATABASE_NAME=t||"websqlstore",this.DATABASE_VERSION=n||"1.0",this.TABLE_NAME=this.DATABASE_NAME+"__data",this.DATABASE_SIZE=5242880};return i.prototype={isValid:function(){return!!window.openDatabase},init:function(e){e=t(e);try{this.isValid()&&(this.db=window.openDatabase(this.DATABASE_NAME,this.DATABASE_VERSION,this.DATABASE_NAME,this.DATABASE_SIZE))}catch(n){return e("error opening websql database: "+n.message?n.message:n)}if(!this.db)return e("No db available");var r="CREATE TABLE IF NOT EXISTS "+this.TABLE_NAME+" (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)";this.db.transaction(function(e){e.executeSql(r,[])},function(n){return e(n),!0},function(){e(null)})},get:function(e,r){r=t(r),e=n(e);if(!this.db)return r("No db available");var i="SELECT value FROM "+this.TABLE_NAME+" WHERE id = ?";this.db.transaction(function(t){t.executeSql(i,[e],function(n,i){var s=null;if(i.rows.length>0){s=i.rows.item(0).value;try{s=JSON.parse(s)}catch(o){return r("JSON Parse error: "+s)}}s?r(null,s):r("No data found for key: "+e)})},function(t){return r(t),!0})},save:function(e,i,s){s=t(s),e=n(e);if(!this.db)return s("No db available");var o;try{o=JSON.stringify(i)}catch(u){return r(u),s("JSON Parse error: "+i)}var a="INSERT OR REPLACE INTO "+this.TABLE_NAME+" (id, value, timestamp) VALUES (?,?,?)",f=[e,o,(new Date).getTime()];this.db.transaction(function(e){e.executeSql(a,f,function(){s(null,i)})},function(t){return s(t),!0})},drop:function(e,r){r=t(r),e=n(e);if(!this.db)return r("No db available");var i="DELETE FROM "+this.TABLE_NAME+" WHERE id = ?";this.db.transaction(function(t){t.executeSql(i,[e],function(){r(null)})},function(t){return r(t),!0})},nuke:function(e){e=t(e);if(!this.db)return e("No db available");var n="DELETE FROM "+this.TABLE_NAME;this.db.transaction(function(t){t.executeSql(n,[],function(){e(null)})},function(n){return e(n),!0})}},i}typeof define=="function"&&define.amd?define("WebSQLStorage",["storageHelpers"],function(t){return e(t)}):window.WebSQLStorage=e(window.storageHelpers)}(),function(){"use strict";function t(t){var n=t.ensureCallback,r=t.parseKey,i=t.out,s=function(e){if(!this.isValid())return!1;e||(e={});var t=e.storeName,n=e.version;try{n=parseInt(n,10)}catch(r){n=1}if(n<1||isNaN(n))n=1;this.db=null,this.DATABASE_VERSION=n,this.DATABASE_NAME=t||"idbstore",this.OBJECT_STORE_NAME=this.DATABASE_NAME+"__data"};return s.prototype={isValid:function(){return!!e&&"indexedDB"in window},init:function(t){t=n(t);var r=this,i=this.OBJECT_STORE_NAME,s;try{s=e.open(this.DATABASE_NAME,this.DATABASE_VERSION)}catch(o){return t(o)}s.onupgradeneeded=function(e){if(!e||!e.target||!e.target.result)return t("IDBStorage.js - request.onupgradeneeded: no database instance in e.target.result");var n=e.target.result;try{n.objectStoreNames.contains(i)&&n.deleteObjectStore(i),n.createObjectStore(i,{keyPath:"id",autoIncrement:!1})}catch(e){t(e)}},s.onsuccess=function(e){if(!e||!e.target||!e.target.result)return t("IDBStorage.js - request.onsuccess: no database instance in e.target.result");r.db=e.target.result,t(null)},s.onerror=function(e){if(!e||!e.target||!e.target.error)return t("IDBStorage.js - request.onupgradeneeded: no error info in e.target.error");try{var n=e&&e.target&&e.target.error?e.target.error:e;t(n)}catch(e){t(e)}}},get:function(e,t){t=n(t),e=r(e);var i,s,o=this.OBJECT_STORE_NAME;if(!this.db)return t("IDBStorage.js this.db is undefined");try{i=this.db.transaction([o],"readonly"),s=i.objectStore(o);var u=s.get(e);u.onsuccess=function(n){var r=n.target.result,i=!!r,s=i===!1||!r||!r.data;return s?t("No data found for key: "+e):t(null,r.data)},u.onerror=function(e){t(e)}}catch(a){return t(a)}},save:function(e,t,s){s=n(s),e=r(e);if(!this.db)return s("IDBStorage.js this.db is undefined");var o,u,a,f=this.OBJECT_STORE_NAME;try{o=this.db.transaction([f],"readwrite"),u=o.objectStore(f);try{a=u.put({id:e,data:t}),a.onsuccess=function(){s(null,t)},a.onerror=function(e){return s(e),!1}}catch(l){return i("IDB Error save at key="+e," data: ",t," error: ",l),s(l)}}catch(l){return i(e,l),s(l)}},drop:function(e,t){t=n(t),e=r(e);if(!this.db)return t("IDBStorage.js this.db is undefined");var s=this.OBJECT_STORE_NAME;try{var o=this.db.transaction([s],"readwrite"),u=o.objectStore(s);try{var a=u["delete"](e);a.onsuccess=function(){t(null)},a.onerror=function(e){t(e)}}catch(f){return i("IDB Error delete: ",f," key ",e),t(f)}}catch(f){return t(f)}},nuke:function(e){e=n(e);if(!this.db)return e("IDBStorage.js this.db is undefined");var t=this.OBJECT_STORE_NAME;try{var r=this.db.transaction([t],"readwrite"),s=r.objectStore(t),o=s.clear();o.onsuccess=function(){e(null)},o.onerror=function(t){e(t)}}catch(u){return i("IDB Error nuke: ",u),e(u)}}},s}var e=window.indexedDB||window.webkitIndexedDB||window.mozIndexedDB||window.msIndexedDB;typeof define=="function"&&define.amd?define("IDBStorage",["storageHelpers"],function(e){return t(e)}):window.IDBStorage=t(window.storageHelpers)}(),function(){"use strict";function e(e,t,n){var r=n.ensureCallback,i=function(){console&&console.error&&console.error.apply(console,arguments)},s={"indexeddb-storage":new t,"websql-storage":new e},o=function(n,o){var u=this;this.adapter=null,n=n||{},n.storeName=n.storeName||"vanilla_store",n.version=n.version||"1.0",o=r(o),s={"indexeddb-storage":new t(n),"websql-storage":new e(n)};if(n&&n.adapterID)this.adapter=s[n.adapterID],this.adapterID=n.adapterID;else for(var a in s){var f=typeof s[a].isValid=="function";if(f&&s[a].isValid()){this.adapter=s[a],this.adapterID=a;break}}var l=this.adapterID;typeof window.cordova!="undefined"&&(l="websql-storage",this.adapter=s[l],this.adapterID=l);if(!this.adapter||!this.adapter.isValid())return o.apply(u,["no adapter or adapter not valid - id="+l]);try{this.adapter.init(function(e){if(e)return i("VanillaStorage.js error initializing adapter",e),o.apply(u,["error in init of adapter id="+l]);o.call(u)})}catch(c){return i(c),o.apply(u,["exception in init of adapter id="+l])}};return o.prototype={isValid:function(){return this.adapter.isValid()},get:function(e,t){t=r(t),this.adapter.get(e,t)},save:function(e,t,n){n=r(n),this.adapter.save(e,t,n)},drop:function(e,t){t=r(t),this.adapter.drop(e,t)},nuke:function(e){e=r(e),this.adapter.nuke(e)}},o.isValid=function(e){var t=s[e];return t?t.isValid():!1},o}typeof define=="function"&&define.amd?define("VanillaStorage",["WebSQLStorage","IDBStorage","storageHelpers"],function(t,n,r){var i=e(t,n,r);return i}):window.VanillaStorage=e(window.WebSQLStorage,window.IDBStorage,window.storageHelpers)}()})();