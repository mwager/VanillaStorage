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

(function(){(function(){"use strict";function e(e){return e=e.replace(/\//g,""),e=e.replace(/[:]/g,""),e=e.replace(/[.]/g,""),"ls_"+e}var t=function(){this.storage=window.localStorage;var e=this;this.isValid=!!window.localStorage&&function(){var t=!0,n=Math.random();try{e.storage.setItem(n,n)}catch(r){t=!1}return e.storage.removeItem(n),t}();if(!this.isValid)throw"No window.localStorage support in here: "+navigator.userAgent;if(!window.JSON)throw"No window.JSON support in here: "+navigator.userAgent};t.prototype={get:function(t){t=e(t);var n=JSON.parse(this.storage.getItem(t));return n},save:function(t,n){t=e(t),this.storage.setItem(t,JSON.stringify(n))},drop:function(t){t=e(t),this.storage.removeItem(t)},nuke:function(){this.storage.clear()}},typeof define=="function"&&define.amd?define("LocalStorage",[],function(){return t}):window.LocalStorage=t})(),function(){"use strict";var e={ensureCallback:function(e){return typeof e!="function"?function(){}:e},parseKey:function(e){return e=e.replace(/\//g,""),e=e.replace(/[:]/g,""),e=e.replace(/[.]/g,""),e},out:function(){if(!window.console||!console.log)return!1;arguments[0]="[Vanilla LOG] "+arguments[0],console.log.apply(console,arguments)}};typeof define=="function"&&define.amd?define("storageHelpers",[],function(){return e}):window.storageHelpers=e}(),function(){"use strict";function e(e){var t=e.ensureCallback,n=e.parseKey,r=function(e,t){if(!this.isValid())return!1;this.db=null,this.DATABASE_NAME=e||"websqlstore",this.DATABASE_VERSION=t||"1.0",this.TABLE_NAME=this.DATABASE_NAME+"__data",this.DATABASE_SIZE=5242880};return r.prototype={isValid:function(){return!!window.openDatabase},init:function(e){e=t(e);try{this.isValid()&&(this.db=window.openDatabase(this.DATABASE_NAME,this.DATABASE_VERSION,this.DATABASE_NAME,this.DATABASE_SIZE))}catch(n){return e("error opening websql database: "+n.message?n.message:n)}if(!this.db)return e("No db available");var r="CREATE TABLE IF NOT EXISTS "+this.TABLE_NAME+" (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)";this.db.transaction(function(e){e.executeSql(r,[])},function(n){return e(n),!0},function(){e(null)})},get:function(e,r){r=t(r),e=n(e);if(!this.db)return r("No db available");var i="SELECT id, value FROM "+this.TABLE_NAME+" WHERE id = ?";this.db.transaction(function(t){t.executeSql(i,[e],function(n,i){var s=null;if(i.rows.length>0){s=i.rows.item(0).value;try{s=JSON.parse(s)}catch(o){return r("JSON Parse error: "+s)}}s?r(null,s):r("No data found for key: "+e)})},function(t){return r(t),!0})},save:function(e,r,i){i=t(i),e=n(e);if(!this.db)return i("No db available");var s;try{s=JSON.stringify(r)}catch(o){return i("JSON Parse error: "+r)}var u="INSERT OR REPLACE INTO "+this.TABLE_NAME+" (id, value, timestamp) VALUES (?,?,?)",a=[e,s,(new Date).getTime()];this.db.transaction(function(e){e.executeSql(u,a,function(){i(null,r)})},function(t){return i(t),!0})},drop:function(e,r){r=t(r),e=n(e);if(!this.db)return r("No db available");var i="DELETE FROM "+this.TABLE_NAME+" WHERE id = ?";this.db.transaction(function(t){t.executeSql(i,[e],function(){r(null)})},function(t){return r(t),!0})},nuke:function(e){e=t(e);if(!this.db)return e("No db available");var n="DELETE FROM "+this.TABLE_NAME;this.db.transaction(function(t){t.executeSql(n,[],function(){e(null)})},function(n){return e(n),!0})}},r}typeof define=="function"&&define.amd?define("WebSQLStorage",["storageHelpers"],function(t){return e(t)}):window.WebSQLStorage=e(window.storageHelpers)}(),function(){"use strict";function t(t){var n=t.ensureCallback,r=t.parseKey,i=t.out,s=function(e,t){if(!this.isValid())return!1;try{t=parseInt(t,10)}catch(n){t=1}if(t<1||isNaN(t))t=1;this.db=null,this.DATABASE_VERSION=t,this.DATABASE_NAME=e||"idbstore",this.OBJECT_STORE_NAME=this.DATABASE_NAME+"__data"};return s.prototype={isValid:function(){return!!e&&"indexedDB"in window},init:function(t){t=n(t);var r=this,i=this.OBJECT_STORE_NAME,s;try{s=e.open(this.DATABASE_NAME,this.DATABASE_VERSION)}catch(o){return t(o)}s.onupgradeneeded=function(e){if(!e||!e.target||!e.target.result)return t("IDBStorage.js - request.onupgradeneeded: no database instance in e.target.result");var n=e.target.result;try{n.objectStoreNames.contains(i)&&n.deleteObjectStore(i),n.createObjectStore(i,{keyPath:"id",autoIncrement:!1})}catch(e){t(e)}},s.onsuccess=function(e){if(!e||!e.target||!e.target.result)return t("IDBStorage.js - request.onsuccess: no database instance in e.target.result");r.db=e.target.result,t(null)},s.onerror=function(e){if(!e||!e.target||!e.target.error)return t("IDBStorage.js - request.onupgradeneeded: no error info in e.target.error");try{var n=e&&e.target&&e.target.error?e.target.error:e;t(n)}catch(e){t(e)}}},get:function(e,t){t=n(t),e=r(e);var i,s,o=this.OBJECT_STORE_NAME;if(!this.db)return t("IDBStorage.js this.db is undefined");try{i=this.db.transaction([o],"readonly"),s=i.objectStore(o);var u=s.get(e);u.onsuccess=function(n){var r=n.target.result,i=!!r,s=i===!1||!r||!r.data;return s?t("No data found for key: "+e):t(null,r.data)},u.onerror=function(e){t(e)}}catch(a){return t(a)}},save:function(e,t,s){s=n(s),e=r(e);if(!this.db)return s("IDBStorage.js this.db is undefined");var o,u,a,f=this.OBJECT_STORE_NAME;try{o=this.db.transaction([f],"readwrite"),u=o.objectStore(f);try{a=u.put({id:e,data:t}),a.onsuccess=function(){s(null,t)},a.onerror=function(e){return s(e),!1}}catch(l){return i("IDB Error save at key="+e,l," data: ",t,"KEY: "+e),s(l)}}catch(l){return i(e,l),s(l)}},drop:function(e,t){t=n(t),e=r(e);if(!this.db)return t("IDBStorage.js this.db is undefined");var s=this.OBJECT_STORE_NAME;try{var o=this.db.transaction([s],"readwrite"),u=o.objectStore(s);try{var a=u.delete(e);a.onsuccess=function(){t(null)},a.onerror=function(e){t(e)}}catch(f){return i("IDB Error delete: ",f," key ",e),t(f)}}catch(f){return t(f)}},nuke:function(e){e=n(e);if(!this.db)return e("IDBStorage.js this.db is undefined");var t=this.OBJECT_STORE_NAME;try{var r=this.db.transaction([t],"readwrite"),s=r.objectStore(t),o=s.clear();o.onsuccess=function(){e(null)},o.onerror=function(t){e(t)}}catch(u){return i("IDB Error nuke: ",u),e(u)}}},s}var e=window.indexedDB||window.webkitIndexedDB||window.mozIndexedDB||window.msIndexedDB;typeof define=="function"&&define.amd?define("IDBStorage",["storageHelpers"],function(e){return t(e)}):window.IDBStorage=t(window.storageHelpers)}(),function(){"use strict";function e(e,t,n,r){var i=r.ensureCallback,s=function(){console&&console.error&&console.error.apply(console,arguments)},o={"indexeddb-storage":new n,"websql-storage":new t},u=function(r,u){var a=this;this.adapter=null,r=r||{},r.storeName=r.storeName||"vanilla_store",r.version=r.version||"1.0",u=i(u),o={"indexeddb-storage":new n(r.storeName,r.version),"websql-storage":new t(r.storeName,r.version)};var f=!1,l=function(){if(f)return!1;f=!0;try{this.localStorageFallback=!0,this.adapter=new e,this.adapterID="local-storage",u.call(a)}catch(t){s(t),u.apply(a,["window.localStorage not supported in this browser: "+navigator.userAgent])}};if(r&&r.adapterID)this.adapter=o[r.adapterID],this.adapterID=r.adapterID;else for(var c in o){var h=typeof o[c].isValid=="function";if(h&&o[c].isValid()){this.adapter=o[c],this.adapterID=c;break}}if(typeof window.cordova!="undefined"){var p="websql-storage";this.adapter=o[p],this.adapterID=p}if(!this.adapter||!this.adapter.isValid())return l.call(this);try{this.adapter.init(function(e){if(e)return s("VanillaStorage.js error initializing adapter",e),l.call(a);u.call(a)})}catch(d){return s(d),l.call(a)}};return u.prototype={isValid:function(){return this.adapter.isValid()},get:function(e,t){t=i(t);if(this.localStorageFallback)try{var n=this.adapter.get(e);n?t(null,n):t("No data found using LS adapter")}catch(r){t(r)}else this.adapter.get(e,t)},save:function(e,t,n){n=i(n);if(this.localStorageFallback)try{this.adapter.save(e,t),n(null,t)}catch(r){n(r)}else this.adapter.save(e,t,n)},drop:function(e,t){t=i(t);if(this.localStorageFallback)try{this.adapter.drop(e),t(null)}catch(n){t(n)}else this.adapter.drop(e,t)},nuke:function(e){e=i(e);if(this.localStorageFallback)try{this.adapter.nuke(),e(null)}catch(t){e(t)}else this.adapter.nuke(e)}},u.isValid=function(e){var t=o[e];return t?t.isValid():!1},u}typeof define=="function"&&define.amd?define("VanillaStorage",["LocalStorage","WebSQLStorage","IDBStorage","storageHelpers"],function(t,n,r,i){var s=e(t,n,r,i);return s}):window.VanillaStorage=e(window.LocalStorage,window.WebSQLStorage,window.IDBStorage,window.storageHelpers)}()})();