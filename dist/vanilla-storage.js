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
 * @version 0.4.2
 */

(function(){(function(){"use strict";function e(e){return e=e.replace(/\//g,""),e=e.replace(/[:]/g,""),e=e.replace(/[.]/g,""),"ls_"+e}var t=function(){this.storage=window.localStorage;var e=this;this.isValid=!!window.localStorage&&function(){var t=!0,n=Math.random();try{e.storage.setItem(n,n)}catch(r){t=!1}return e.storage.removeItem(n),t}();if(!this.isValid)throw"No window.localStorage support in here: "+navigator.userAgent;if(!window.JSON)throw"No window.JSON support in here: "+navigator.userAgent};t.prototype={get:function(t){t=e(t);var n=JSON.parse(this.storage.getItem(t));return n},save:function(t,n){t=e(t),this.storage.setItem(t,JSON.stringify(n))},"delete":function(t){t=e(t),this.storage.removeItem(t)},nuke:function(){this.storage.clear()}},typeof define=="function"&&define.amd?define("LocalStorage",[],function(){return t}):window.LocalStorage=t})(),function(){"use strict";var e={ensureCallback:function(e){return typeof e!="function"?function(){}:e},parseKey:function(e){return e=e.replace(/\//g,""),e=e.replace(/[:]/g,""),e=e.replace(/[.]/g,""),e},out:function(){if(!window.console||!console.log)return!1;arguments[0]="[Vanilla LOG] "+arguments[0],console.log.apply(console,arguments)}};typeof define=="function"&&define.amd?define("storageHelpers",[],function(){return e}):window.storageHelpers=e}(),function(){"use strict";function e(e){var t=e.ensureCallback,n=e.parseKey,r=function(){if(!this.isValid())return!1;this.db=null,this.TABLE_NAME="vanilla_store",this.DATABASE_NAME="vanilladb",this.DATABASE_VERSION="1.0.0",this.DATABASE_SIZE=5242880};return r.prototype={isValid:function(){return typeof window.openDatabase=="function"},init:function(e){e=t(e);try{this.isValid()&&(this.db=window.openDatabase(this.DATABASE_NAME,this.DATABASE_VERSION,this.DATABASE_NAME,this.DATABASE_SIZE))}catch(n){return e("error opening websql database: "+n.message?n.message:n)}if(!this.db)return e("No db available");var r="CREATE TABLE IF NOT EXISTS "+this.TABLE_NAME+" (id NVARCHAR(32) UNIQUE PRIMARY KEY, value TEXT, timestamp REAL)";this.db.transaction(function(e){e.executeSql(r,[])},function(n){return e(n),!0},function(){e(null)})},get:function(e,r){r=t(r),e=n(e);if(!this.db)return r("No db available");var i="SELECT id, value FROM "+this.TABLE_NAME+" WHERE id = ?";this.db.transaction(function(t){t.executeSql(i,[e],function(n,i){var s=null;if(i.rows.length>0){s=i.rows.item(0).value;try{s=JSON.parse(s)}catch(o){return r("JSON Parse error: "+s)}}s?r(null,s):r("No data found for key: "+e)})},function(t){return r(t),!0})},save:function(e,r,i){i=t(i),e=n(e);var s;try{s=JSON.stringify(r)}catch(o){return i("JSON Parse error: "+r)}if(!this.db)return i("No db available");var u="INSERT OR REPLACE INTO "+this.TABLE_NAME+" (id, value, timestamp) VALUES (?,?,?)",a=[e,s,(new Date).getTime()];this.db.transaction(function(e){e.executeSql(u,a,function(){i(null,r)})},function(t){return i(t),!0})},"delete":function(e,r){if(!this.db)return r("No db available");r=t(r),e=n(e);var i="DELETE FROM "+this.TABLE_NAME+" WHERE id = ?";this.db.transaction(function(t){t.executeSql(i,[e],function(){r(null)})},function(t){return r(t),!0})},nuke:function(e){e=t(e);var n="DELETE FROM "+this.TABLE_NAME;this.db.transaction(function(t){t.executeSql(n,[],function(){e(null)})},function(n){return e(n),!0})}},r}typeof define=="function"&&define.amd?define("WebSQLStorage",["storageHelpers"],function(t){return e(t)}):window.WebSQLStorage=e(window.storageHelpers)}(),function(){"use strict";function t(t){var n=t.ensureCallback,r=t.parseKey,i=t.out,s=function(){if(!this.isValid())return!1;this.DATABASE_NAME="vanilla_idb",this.DATABASE_VERSION=1,this.OBJECT_STORE_NAME="vanilla_idb_store",this.db=null};return s.prototype={isValid:function(){return!!e&&"indexedDB"in window},init:function(t){t=n(t);var r=this,s=this.OBJECT_STORE_NAME,o=e.open(this.DATABASE_NAME,this.DATABASE_VERSION);o.onupgradeneeded=function(e){var t=e.target.result;t.objectStoreNames.contains(s)&&t.deleteObjectStore(s);var n=t.createObjectStore(s,{keyPath:"id",autoIncrement:!1});i("---indexed-db--- created store: "+s,n)},o.onsuccess=function(e){r.db=e.target.result,t(null)},o.onerror=function(e){t(e.target.error)}},get:function(e,t){t=n(t),e=r(e);var i,s,o=this.OBJECT_STORE_NAME;try{i=this.db.transaction([o],"readonly"),s=i.objectStore(o);var u=s.get(e);u.onsuccess=function(n){var r=n.target.result,i=!!r,s=i===!1||!r||!r.data;return s?t("No data found for key: "+e):t(null,r.data)},u.onerror=function(e){t(e)}}catch(a){return t(a)}},save:function(e,t,s){s=n(s),e=r(e);var o,u,a,f=this.OBJECT_STORE_NAME;try{o=this.db.transaction([f],"readwrite"),u=o.objectStore(f);try{a=u.put({id:e,data:t}),a.onsuccess=function(){s(null,t)},a.onerror=function(e){s(e)}}catch(l){return i("IDB Error save at key="+e,l," data: ",t,"KEY: "+e),s(l)}}catch(l){return i(e,l),s(l)}},"delete":function(e,t){t=n(t),e=r(e);var s=this.OBJECT_STORE_NAME;try{var o=this.db.transaction([s],"readwrite"),u=o.objectStore(s);try{var a=u.delete(e);a.onsuccess=function(){t(null)},a.onerror=function(e){t(e)}}catch(f){return i("IDB Error delete: ",f," key ",e),t(f)}}catch(f){return t(f)}},nuke:function(e){e=n(e);var t=this.OBJECT_STORE_NAME;try{var r=this.db.transaction([t],"readwrite"),s=r.objectStore(t),o=s.clear();o.onsuccess=function(){e(null)},o.onerror=function(t){e(t)}}catch(u){return i("IDB Error nuke: ",u),e(u)}}},s}var e=window.indexedDB||window.webkitIndexedDB||window.mozIndexedDB||window.msIndexedDB;typeof define=="function"&&define.amd?define("IDBStorage",["storageHelpers"],function(e){return t(e)}):window.IDBStorage=t(window.storageHelpers)}(),function(){"use strict";function e(e,t,n,r){var i=r.ensureCallback,s={"indexeddb-storage":new n,"websql-storage":new t},o=function(t,n){var r=this;n=i(n),this.adapter=null;if(t&&t.adapterID)this.adapter=s[t.adapterID],this.adapterID=t.adapterID;else for(var o in s){var u=typeof s[o].isValid=="function";if(u&&s[o].isValid()){this.adapter=s[o],this.adapterID=o;break}}if(typeof window.cordova!="undefined"){var a="websql-storage";this.adapter=s[a],this.adapterID=a}if(!this.adapter||!this.adapter.isValid())return this.localStorageFallback=!0,this.adapter=new e,n.call(r,null);this.adapter.init(function(e){e&&n.call(r,e),n.call(r,null)})};return o.prototype={isValid:function(){return this.adapter.isValid()},get:function(e,t){t=i(t);if(this.localStorageFallback)try{var n=this.adapter.get(e);t(null,n)}catch(r){t(r)}else this.adapter.get(e,t)},save:function(e,t,n){n=i(n);if(this.localStorageFallback)try{this.adapter.save(e,t),n(null,t)}catch(r){n(r)}else this.adapter.save(e,t,n)},"delete":function(e,t){t=i(t);if(this.localStorageFallback)try{this.adapter.delete(e),t(null)}catch(n){t(n)}else this.adapter.delete(e,t)},nuke:function(e){e=i(e);if(this.localStorageFallback)try{this.adapter.nuke(),e(null)}catch(t){e(t)}else this.adapter.nuke(e)}},o.isValid=function(e){var t=s[e];return t?t.isValid():!1},o}typeof define=="function"&&define.amd?define("VanillaStorage",["LocalStorage","WebSQLStorage","IDBStorage","storageHelpers"],function(t,n,r,i){var s=e(t,n,r,i);return s}):window.VanillaStorage=e(window.LocalStorage,window.WebSQLStorage,window.IDBStorage,window.storageHelpers)}()})();