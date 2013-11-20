/**
 *  jshint options  - JSConsole , jQuery , $ , forin
 */

;(function( JSConsole , $ ){
    'use strict';

    ///////////////  Adding Custom Functions into jQuery name space ////////////////
    (function(){
        $.fn.setCaret = function() {
            var range, selection;
            return this.each(function() {
                this.focus();
                if (document.createRange) { // web kit browsers , IE9+
                    range = document.createRange();//Create a range (a range is a like the selection but invisible)
                    range.selectNodeContents(this);//Select the entire contents of the element with the range
                    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                    selection = window.getSelection();//get the selection object (allows you to change selection)
                    selection.removeAllRanges();//remove any selections already made
                    selection.addRange(range);//make the range you have just created the visible selection
                } else if (document.selection) { // IE8 & lower
                    range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
                    range.moveToElementText(this);//Select the entire contents of the element with the range
                    range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
                    range.select();//Select the range (make it the visible selection
                }
            });
        };
    })();
    ////////////////////////// End of Custom Funtions /////////////////////////


    JSConsole.Utils = (function(){

        function Utils(){}

        //arguments - [cbFun , params ]
        Utils.prototype.callBack = function(){
            if(typeof arguments[0] == "function"){
                arguments[0].apply(this , [arguments[1]]);
            }else{
                this.error('not valid function or function does not exist');
            }
        };

        Utils.prototype.findKey = function(event){
            return event.which || event.keyCode;
        };

        Utils.prototype.error = function(msg){
            throw new error(msg);
        };

        Utils.prototype.trim = function(str){
            return (str || "").replace(/^\s+|\s+$/g,"");
        };

        // arguments -  [tag , nameProp , class]
        Utils.prototype.appendItems = function(){
            var i = 0,len = this[arguments[1]].length,list = [];
            for (; i < len ; i++) {
                list[i] = '<'+arguments[0]+' class="'+arguments[2]+'">'+this[arguments[1]][i]+'</'+arguments[0]+'>';
            }
            return list.join('');
        };

        return Utils;

    })();

    JSConsole.Historystore = (function(){

        function Historystore(){}

        Historystore.prototype.setHistory = function(){

        };

        Historystore.prototype.getHistory = function(){

        };

        Historystore.prototype.showHistory = function(){

        };


        return Historystore;

    })();


    JSConsole.Executecommand = (function(){

        Executecommand.prototype = new JSConsole.Historystore();

        function Executecommand(){
            this.customCommands = {
                history : this.showHistory
            };
        }

        Executecommand.prototype.sendCommand = function(){
            this.cmd = this.$commandTxt.text();
            this.properties=[];
            this.properties.push('>> '+this.cmd);
            this.executeCommand();
            this.updateClass='';
        };

        Executecommand.prototype.executeCommand = function(){
            try{
                var opt = this.helperFrame.eval(this.cmd);
                this.updateClass = 'success';
            } catch (e){
                var opt = e.message;
                this.updateClass = 'error';
            }
            this.properties.push(this.stringify(opt));
        };

        //////////// below function definition/code  taken from the JSconsole ////////////
        //TODO : cleanup &  document code flow for others to understand
        Executecommand.prototype.stringify = function(o, simple, visited){
            var json = '', i, vi, type = '', parts = [], names = [], circular = false;
            visited = visited || [];

            //TODO : will be removed this nesting  , coz function definition will load into memory whenever we call parent method 'stringyfy'
            function sortci(a, b) {
                return a.toLowerCase() < b.toLowerCase() ? -1 : 1;
            }

            try {
                type = ({}).toString.call(o);
            } catch (e) {
                type = '[object Object]';
            }

              // check for circular references
            for (vi = 0; vi < visited.length; vi++) {
                if (o === visited[vi]) {
                    circular = true;
                    break;
                }
            }

            // checking for the type of Object & stringify the object
            if (circular) {
                json = '[circular]';
            }else if (type == '[object String]') {
                json = '"' + o.replace(/"/g, '\\"') + '"';
            }else if (type == '[object Array]') {
                visited.push(o);
                json = '[';
                for (i = 0; i < o.length; i++) {
                    parts.push(this.stringify(o[i], simple, visited));
                }
                json += parts.join(', ') + ']';
                //json;
            }else if (type == '[object Object]') {
                visited.push(o);

                json = '{';
                for (i in o) {
                    names.push(i);
                }
                names.sort(sortci);
                for (i = 0; i < names.length; i++) {
                    parts.push( this.stringify(names[i], undefined, visited) + ': ' + this.stringify(o[ names[i] ], simple, visited) );
                }
                json += parts.join(', ') + '}';
            }else if (type == '[object Number]') {
                json = o+'';
            }else if (type == '[object Boolean]') {
                json = o ? 'true' : 'false';
            }else if (type == '[object Function]') {
                json = o.toString();
            }else if (o === null) {
                json = 'null';
            }else if (o === undefined) {
                json = 'undefined';
            }else if (simple === undefined) {
                visited.push(o);

                json = type + '{\n';
                for (i in o) {
                    names.push(i);
                }
                names.sort(sortci);
                for (i = 0; i < names.length; i++) {
                    parts.push(names[i] + ': ' + this.stringify(o[names[i]], true, visited));
                }
                json += parts.join(',\n') + '\n}';
            }else {
                try {
                    json = o+''; // should look like an object
                } catch (e) {}
            }
            return json;
        };

        return Executecommand;

    })();


    JSConsole.Scriptdebugger = (function(){

        Scriptdebugger.prototype = new JSConsole.Executecommand();

        function Scriptdebugger(){
            // cached jQuery elements
            this.$command = $(arguments[0]);
            this.$commandTxt = $('#commandtxt');
            this.cacheProp={};
            this.propCounter=0;
            this.properties=[];
            this.$output = $('#output');
            this.$console=$('#console');
            this.$propListWrapper = $('#PropWrapper');
            this.$propList = $('#PropList');
            this.rejectKey = [35,38,39,40]; // rejeck key stroke onkeyup , if need more keep on add
            // TODO : make it configurable way
            //cached helper iframe  window object
            this.helperFrame = document.getElementById("helperframe").contentWindow || document.getElementById("helperframe").contentDocument;
            // collect the window object from iframe not from top window
        }

        Scriptdebugger.prototype.init = function(){
            var _this=this;
            this.$commandTxt.focus();
            // overwrite the helperFrame console - log & dir.. , otherwise command will execute in borwser console
            this.helperFrame.console.log = function() {
                var l = arguments.length, i = 0;
                for (; i < l; i++) {
                    _this.properties.push(_this.stringify(arguments[i], true));
                }
            };

            this.helperFrame.console.dir = function () {
                var l = arguments.length, i = 0;
                for (; i < l; i++) {
                    _this.properties.push(_this.stringify(arguments[i]));
                }

            };

            // update css for the consoleWrapper
            this.$console.css({
                'height' : $(window).height() - 40
            });
            $('.rightpane').css('height',$(window).height());

            // cache the props for later use
            this.getSuggestions( 'window' );
            this.events();
        };

        // register all events below , so that easiar to maintain all the listenrs
        Scriptdebugger.prototype.events = function(){
            // event listener when user types in
            this.$command.on({
                keyup : $.proxy(this.autoPopulate , this) ,
                keydown : $.proxy(this.handleKeyStroke , this) ,
            }, "#commandtxt" );

            this.$command.on('click' , $.proxy(function(e){
                this.$commandTxt.focus();
            },this));
        };

        /**
         * handle keystokes pressed in
         * @param { Event } - e
         */
        Scriptdebugger.prototype.handleKeyStroke = function( e ){
            var key = JSConsole.Utils.prototype.findKey.call('', e ),
            cmdTxt =  JSConsole.Utils.prototype.trim.call('',$(e.currentTarget).text()),
            len = this.properties.length;
            // if user pressed Right Arrow & END key , fill with property text
            if( cmdTxt.length !== 0 && (key == 35 || key == 39)) {
                // collect text from suggest node & append text to main area
                // TODO : cache the 'suggest' node
                // TODO : document below query , others to understand
                this.$commandTxt
                    .data('txt',$('.autopop').text())
                    .next().html('')
                .end()
                    .append(function(){
                        return $(this).data('txt');
                    })
                    .setCaret()
                ;
                this.removeSuggestions();
                this.propCounter=0;
            }
            // if user pressed UP or BOTTOM , autopopulate back & forth
            else if( len > 1 && (key == 38 || key == 40) ){
                //TODO : clean up below code & check this logic with larger data set
                this.propCounter = (key == 40 ) ? this.propCounter=this.propCounter+1 : ((key == 38 ) ?
                                    this.propCounter=this.propCounter-1: this.propCounter) ;
                this.propCounter = (this.propCounter == len ) ? 0 : ((this.propCounter == -1) ?
                                    this.propCounter=len-1 : this.propCounter) ;
                this.$propList.find('li')
                              .css('background-color','')
                              .eq(this.propCounter)
                              .css('background-color','#ccc');
                $('.autopop').remove();
                this.appendProperty();
                e.preventDefault();
            }
            // if user press ENTER + SHIFT , let it go to next line for multiline code
            else if(key == 13 && e.shiftKey === true){} // TODO : add some defensive code
            // if user press ENTER , submit command to execute
            else if(key == 13 && cmdTxt.length !== 0){
                this.sendCommand();
                // empty command text , set cursor position
                this.$commandTxt.text('').focus();
                this.printOutput();
                e.preventDefault();
            }
        };

        /**
         * print executed code & output
         */
        Scriptdebugger.prototype.printOutput = function(){
            var opt = JSConsole.Utils.prototype.appendItems.apply(this , ['li','properties',this.updateClass])
            this.$output.prepend(opt);
            //update classes for appended li
            this.$output.find('li').eq(this.properties.length-1).addClass('last');
        };

        /**
         * auto populate properties based on input
         * @param { Event } - e
         */
        Scriptdebugger.prototype.autoPopulate = function( e ){

            //e.preventDefault();
            // TODO : way i calling mehtods looks ugly , make it simple
            var key = JSConsole.Utils.prototype.findKey.call('', e ),
            cmdTxt =  JSConsole.Utils.prototype.trim.call('',$(e.currentTarget).text());

            // Do early exit if there is no text typed in or pressed any of rejected Key set
            if(this.rejectKey.indexOf(key) !== -1 ) return;
            if( cmdTxt === '' ) {
              this.removeSuggestions();
              return;
            }
            this.propCounter=0;this.removeSuggestions();
            // format the text i.e
            // split the text with period , send the last part as needle
            var list = cmdTxt.split('.'),
            needle = list[list.length-1] ,
            Obj = list.slice(0,list.length-1).join('.') || 'window' ;
            //console.log(keyIn);
            this.needlen=needle.length;
            this.properties = this.getSuggestions( Obj , needle );

            // now got the props , lets auto populate
            // check length
            if(this.properties.length > 0) {
                // always append the first property
                this.appendProperty();
                if(this.properties.length > 1)
                this.$propList.html(JSConsole.Utils.prototype.appendItems.apply(this , ['li','properties','']));
                this.$propList.find('li')
                              .eq(this.propCounter)
                              .css('background-color','#ccc');

            }
        };

        /**
         * Append property text to main command leaving needle text
         * also if user keydown non-printable keys - UP, BOTTOM
         */
        Scriptdebugger.prototype.appendProperty = function(){
            this.$command.append($("<span>")
                                    .addClass("autopop")
                                    .text(this.properties[this.propCounter].slice(this.needlen,this.properties[this.propCounter].length))
                                );
        };

        /**
         * Pull Porperties based on params received by the request
         * @param { String } Obj - string to execute & pull props
         * @param { String } needle - string to filter already pulled props
         * @return { Array } props - properties
         */
        Scriptdebugger.prototype.getSuggestions = function( Obj , needle ){
            // check properties cached or not , if not have it cached for later use
            //console.log(Obj, needle);
            var props = [];
            if( !this.cacheProp[Obj] ) {
                try {
                    var doc = this.helperFrame.eval(Obj);
                    for( var prop in doc ){
                        props.push(prop);
                    }
                    this.cacheProp[Obj] = props.sort();
                }catch(e){
                    this.cacheProp[Obj] = [];
                }

            }else if( needle ) {
                var i=0,len = this.cacheProp[Obj].length;//needlLen=needle.length;
                for( ; i < len ; i++ ){
                    if(this.cacheProp[Obj][i].indexOf(needle) === 0 ){
                        props.push(this.cacheProp[Obj][i]);
                    }
                }
            }
            return props;
        };

        Scriptdebugger.prototype.removeSuggestions = function() {
            //TODO : shoud be removed directly, don't find then remove
            this.$command.find('.autopop').remove();
            //reset populated list , just insert empty don't remove items
            this.$propList.html('');
        };

        return Scriptdebugger;
    })();

})( window.JSConsole = window.JSConsole || {} , jQuery );

new JSConsole.Scriptdebugger('#command').init();
