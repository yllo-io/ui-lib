(function (exports) {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.wholeText !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            // @ts-ignore
            callbacks.slice().forEach(fn => fn.call(this, event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    exports.EThemeType = void 0;
    (function (EThemeType) {
        EThemeType[EThemeType["light"] = 0] = "light";
        EThemeType[EThemeType["dark"] = 1] = "dark";
    })(exports.EThemeType || (exports.EThemeType = {}));

    function createStore() {
        const { subscribe, update, set } = writable({
            themeType: exports.EThemeType.dark,
            isRounded: false,
            isShadow: true,
            isBorder: true,
            isInteractiveCursor: true,
        });
        return {
            subscribe,
            set,
        };
    }
    const _theme = createStore();

    let cursor = 'default';
    function setCursor(newCursor) {
        if (cursor === newCursor)
            return;
        document.body.classList.remove('cursor-' + cursor);
        cursor = newCursor;
        document.body.classList.add('cursor-' + newCursor);
    }
    function setDefaultCursor(defaultCursorVarValue, defaultCursorVarValueWebkit) {
        document.documentElement.style.setProperty('--cursor-default', defaultCursorVarValue);
        if (!defaultCursorVarValueWebkit)
            defaultCursorVarValueWebkit = defaultCursorVarValue;
        document.documentElement.style.setProperty('--cursor-default-webkit', defaultCursorVarValueWebkit);
    }

    const setThemeOptions = (newThemeOptions) => {
        const theme = get_store_value(_theme);
        if (theme.themeType !== newThemeOptions.themeType) {
            if (newThemeOptions.themeType === exports.EThemeType.light)
                setRootVariables(themeVariablesLight);
            else if (newThemeOptions.themeType === exports.EThemeType.dark)
                setRootVariables(themeVariablesDark);
        }
        _theme.set(newThemeOptions);
        if (newThemeOptions.isCircleCursor) {
            if (newThemeOptions.themeType === exports.EThemeType.light)
                setDefaultCursor('var(--cursor-circle-light)', 'var(--cursor-circle-light-webkit)');
            else if (newThemeOptions.themeType === exports.EThemeType.dark)
                setDefaultCursor('var(--cursor-circle-dark)', 'var(--cursor-circle-dark-webkit)');
        }
        else
            setDefaultCursor('var(--cursor-custom)', 'var(--cursor-custom-webkit)');
        function setRootVariables(variables) {
            variables.forEach((variable) => {
                document.documentElement.style.setProperty(variable.key, variable.value);
            });
        }
    };
    const actions = {
        setThemeOptions,
    };
    const themeVariablesLight = [
        { key: '--contrast-1', value: '#0ea580' },
        { key: '--contrast-2', value: '#cd5654' },
        { key: '--contrast-3', value: '#2168ef' },
        { key: '--contrast-4', value: '#f1c636' },
        { key: '--contrast-6', value: '#00cb99' },
        { key: '--contrast-1-rgb', value: '14, 165, 128' },
        { key: '--contrast-2-rgb', value: '205, 86, 84' },
        { key: '--contrast-3-rgb', value: '33, 104, 239' },
        { key: '--contrast-4-rgb', value: '241, 198, 54' },
        { key: '--contrast-6-rgb', value: '0, 203, 153' },
        { key: '--line-1', value: '#f6f6f6' },
        { key: '--line-2', value: '#e7e7e7' },
        { key: '--line-3', value: '#d6d6d6' },
        { key: '--line-4', value: '#989898' },
        { key: '--line-5', value: '#707070' },
        { key: '--line-6', value: '#343434' },
        { key: '--line-7', value: '#161616' },
        { key: '--line-1-rgb', value: '246, 246, 246' },
        { key: '--line-2-rgb', value: '231, 231, 231' },
        { key: '--line-3-rgb', value: '214, 214, 214' },
        { key: '--line-4-rgb', value: '152, 152, 152' },
        { key: '--line-5-rgb', value: '112, 112, 112' },
        { key: '--line-6-rgb', value: '52, 52, 52' },
        { key: '--line-7-rgb', value: '22, 22, 22' },
        { key: '--shadow', value: '0px 4px 28px rgba(0, 0, 0, 0.11)' },
        { key: '--shadow-strong', value: '0px 4px 30px rgba(0, 0, 0, 0.22)' },
    ];
    const themeVariablesDark = [
        { key: '--contrast-1', value: '#2CFFCC' },
        { key: '--contrast-2', value: '#FF7472' },
        { key: '--contrast-3', value: '#58AFFF' },
        { key: '--contrast-4', value: '#FFE079' },
        { key: '--contrast-6', value: '#2CFFCC' },
        { key: '--contrast-1-rgb', value: '44, 255, 204' },
        { key: '--contrast-2-rgb', value: '255, 116, 114' },
        { key: '--contrast-3-rgb', value: '88, 175, 255' },
        { key: '--contrast-4-rgb', value: '255, 224, 121' },
        { key: '--contrast-6-rgb', value: '44, 255, 204' },
        { key: '--line-1', value: '#161616' },
        { key: '--line-2', value: '#343434' },
        { key: '--line-3', value: '#707070' },
        { key: '--line-4', value: '#989898' },
        { key: '--line-5', value: '#d6d6d6' },
        { key: '--line-6', value: '#e7e7e7' },
        { key: '--line-7', value: '#f6f6f6' },
        { key: '--line-1-rgb', value: '22, 22, 22' },
        { key: '--line-2-rgb', value: '52, 52, 52' },
        { key: '--line-3-rgb', value: '112, 112, 112' },
        { key: '--line-4-rgb', value: '152, 152, 152' },
        { key: '--line-5-rgb', value: '214, 214, 214' },
        { key: '--line-6-rgb', value: '231, 231, 231' },
        { key: '--line-7-rgb', value: '246, 246, 246' },
        { key: '--shadow', value: '0px 8px 51px rgba(0, 0, 0, 0.46)' },
        { key: '--shadow-strong', value: '0px 8px 72px rgba(0, 0, 0, 0.84)' },
    ];

    /* src/UI/components/Paper/Paper.svelte generated by Svelte v3.46.4 */

    function create_fragment$8(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr(div, "class", "paper body1");
    			toggle_class(div, "flex_center-center", /*isCenter*/ ctx[6]);
    			toggle_class(div, "padding", /*isPadding*/ ctx[5]);

    			toggle_class(div, "rounded", /*isRounded*/ ctx[1] === undefined
    			? /*$_theme*/ ctx[8].isRounded
    			: /*isRounded*/ ctx[1]);

    			toggle_class(div, "shadow_strong", /*isShadowStrong*/ ctx[3]);

    			toggle_class(div, "shadow", /*isShadow*/ ctx[2] === undefined
    			? /*$_theme*/ ctx[8].isShadow
    			: /*isShadow*/ ctx[2]);

    			toggle_class(div, "column", /*isColumn*/ ctx[4]);
    			toggle_class(div, "background", /*isBackground*/ ctx[7]);

    			toggle_class(div, "border", /*isBorder*/ ctx[0] === undefined
    			? /*$_theme*/ ctx[8].isBorder
    			: /*isBorder*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*isCenter*/ 64) {
    				toggle_class(div, "flex_center-center", /*isCenter*/ ctx[6]);
    			}

    			if (dirty & /*isPadding*/ 32) {
    				toggle_class(div, "padding", /*isPadding*/ ctx[5]);
    			}

    			if (dirty & /*isRounded, undefined, $_theme*/ 258) {
    				toggle_class(div, "rounded", /*isRounded*/ ctx[1] === undefined
    				? /*$_theme*/ ctx[8].isRounded
    				: /*isRounded*/ ctx[1]);
    			}

    			if (dirty & /*isShadowStrong*/ 8) {
    				toggle_class(div, "shadow_strong", /*isShadowStrong*/ ctx[3]);
    			}

    			if (dirty & /*isShadow, undefined, $_theme*/ 260) {
    				toggle_class(div, "shadow", /*isShadow*/ ctx[2] === undefined
    				? /*$_theme*/ ctx[8].isShadow
    				: /*isShadow*/ ctx[2]);
    			}

    			if (dirty & /*isColumn*/ 16) {
    				toggle_class(div, "column", /*isColumn*/ ctx[4]);
    			}

    			if (dirty & /*isBackground*/ 128) {
    				toggle_class(div, "background", /*isBackground*/ ctx[7]);
    			}

    			if (dirty & /*isBorder, undefined, $_theme*/ 257) {
    				toggle_class(div, "border", /*isBorder*/ ctx[0] === undefined
    				? /*$_theme*/ ctx[8].isBorder
    				: /*isBorder*/ ctx[0]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $_theme;
    	component_subscribe($$self, _theme, $$value => $$invalidate(8, $_theme = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { isBorder } = $$props;
    	let { isRounded } = $$props;
    	let { isShadow } = $$props;
    	let { isShadowStrong = false } = $$props;
    	let { isColumn = false } = $$props;
    	let { isPadding = false } = $$props;
    	let { isCenter = false } = $$props;
    	let { isBackground = false } = $$props;

    	$$self.$$set = $$props => {
    		if ('isBorder' in $$props) $$invalidate(0, isBorder = $$props.isBorder);
    		if ('isRounded' in $$props) $$invalidate(1, isRounded = $$props.isRounded);
    		if ('isShadow' in $$props) $$invalidate(2, isShadow = $$props.isShadow);
    		if ('isShadowStrong' in $$props) $$invalidate(3, isShadowStrong = $$props.isShadowStrong);
    		if ('isColumn' in $$props) $$invalidate(4, isColumn = $$props.isColumn);
    		if ('isPadding' in $$props) $$invalidate(5, isPadding = $$props.isPadding);
    		if ('isCenter' in $$props) $$invalidate(6, isCenter = $$props.isCenter);
    		if ('isBackground' in $$props) $$invalidate(7, isBackground = $$props.isBackground);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	return [
    		isBorder,
    		isRounded,
    		isShadow,
    		isShadowStrong,
    		isColumn,
    		isPadding,
    		isCenter,
    		isBackground,
    		$_theme,
    		$$scope,
    		slots
    	];
    }

    class Paper extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {
    			isBorder: 0,
    			isRounded: 1,
    			isShadow: 2,
    			isShadowStrong: 3,
    			isColumn: 4,
    			isPadding: 5,
    			isCenter: 6,
    			isBackground: 7
    		});
    	}
    }

    function interactiveElement(node, { isActive, onClick = undefined, isCursorHover = true }) {
        function onMousemove(event) {
            if (nodeRect) {
                const halfHeight = nodeRect.height / 2;
                const topOffset = (event.y - nodeRect.top - halfHeight) / halfHeight;
                const halfWidth = nodeRect.width / 2;
                const leftOffset = (event.x - nodeRect.left - halfWidth) / halfWidth;
                if (isCursorHover) {
                    hover.style.setProperty('--translateX', `${Math.round(-leftOffset * 3)}px`);
                    hover.style.setProperty('--translateY', `${Math.round(-topOffset)}px`);
                }
                node.style.setProperty('--translateX', `${Math.round(leftOffset * 6)}px`);
                node.style.setProperty('--translateY', `${Math.round(topOffset * 4)}px`);
            }
        }
        function onMouseenter() {
            nodeRect = node.getBoundingClientRect();
            if (hover)
                hover.classList.add('active');
            node.classList.add('interactive-element-hover');
        }
        function onMouseleave() {
            if (hover)
                hover.classList.remove('active');
            if (node)
                node.classList.remove('interactive-element-hover');
        }
        // function onDOMNodeRemoved(event) {
        //     if (isActiveState && event.target === hover) {
        //         deactivation()
        //         activation()
        //     }
        // }
        function activation() {
            isActiveState = true;
            if (isCursorHover) {
                hover = document.createElement('div');
                hover.classList.add('interactive-cursor-hover');
                const style = window.getComputedStyle(node);
                const borderRadius = style.getPropertyValue('border-radius');
                if (borderRadius !== '0px')
                    hover.style.setProperty('--border-radius', borderRadius);
                node.appendChild(hover);
            }
            node.classList.add('interactive-element');
            node.addEventListener('mousemove', onMousemove);
            node.addEventListener('mouseenter', onMouseenter);
            node.addEventListener('mouseleave', onMouseleave);
            // node.addEventListener('DOMNodeRemoved', onDOMNodeRemoved)
            if (onClick)
                node.addEventListener('click', onClick);
        }
        function deactivation() {
            isActiveState = false;
            node.removeEventListener('mousemove', onMousemove);
            node.removeEventListener('mouseenter', onMouseenter);
            node.removeEventListener('mouseleave', onMouseleave);
            // node.removeEventListener('DOMNodeRemoved', onDOMNodeRemoved)
            if (onClick)
                node.removeEventListener('click', onClick);
            if (hover)
                hover.remove();
            if (node) {
                node.classList.remove('interactive-element');
                node.classList.remove('interactive-element-hover');
            }
        }
        let hover;
        let nodeRect;
        let isActiveState = isActive;
        if (isActiveState)
            activation();
        return {
            update({ isActive, onClick = undefined, isCursorHover = true }) {
                if (!isActiveState && isActive)
                    activation();
                else if (isActiveState && !isActive)
                    deactivation();
            },
            destroy() {
                deactivation();
            },
        };
    }

    /* src/UI/components/Button/Button.svelte generated by Svelte v3.46.4 */

    function create_fragment$7(ctx) {
    	let div;
    	let div_class_value;
    	let div_style_value;
    	let interactiveElement_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);

    	return {
    		c() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr(div, "class", div_class_value = "button button_variant_" + /*variant*/ ctx[0] + " noselect " + /*classes*/ ctx[8]);

    			attr(div, "style", div_style_value = /*minWidth*/ ctx[7]
    			? 'min-width: ' + /*minWidth*/ ctx[7]
    			: '');

    			toggle_class(div, "stretched", /*isStretched*/ ctx[2]);

    			toggle_class(div, "button_rounded", /*isRounded*/ ctx[1] === undefined
    			? /*$_theme*/ ctx[12].isRounded
    			: /*isRounded*/ ctx[1]);

    			toggle_class(div, "disabled", !/*isActive*/ ctx[3]);
    			toggle_class(div, "margin_horizontal", /*isMarginHorizontal*/ ctx[4]);
    			toggle_class(div, "margin_vertical", /*isMarginVertical*/ ctx[5]);
    			toggle_class(div, "hover_pointer", /*isHoverPointer*/ ctx[6]);
    			toggle_class(div, "click-animation", /*clickAnimation*/ ctx[10]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen(div, "click", /*click_handler*/ ctx[16]),
    					action_destroyer(interactiveElement_action = interactiveElement.call(null, div, {
    						isActive: /*$_theme*/ ctx[12].isInteractiveCursor && /*isActive*/ ctx[3]
    					}))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 16384)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[14],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[14])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[14], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*variant, classes*/ 257 && div_class_value !== (div_class_value = "button button_variant_" + /*variant*/ ctx[0] + " noselect " + /*classes*/ ctx[8])) {
    				attr(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*minWidth*/ 128 && div_style_value !== (div_style_value = /*minWidth*/ ctx[7]
    			? 'min-width: ' + /*minWidth*/ ctx[7]
    			: '')) {
    				attr(div, "style", div_style_value);
    			}

    			if (interactiveElement_action && is_function(interactiveElement_action.update) && dirty & /*$_theme, isActive*/ 4104) interactiveElement_action.update.call(null, {
    				isActive: /*$_theme*/ ctx[12].isInteractiveCursor && /*isActive*/ ctx[3]
    			});

    			if (dirty & /*variant, classes, isStretched*/ 261) {
    				toggle_class(div, "stretched", /*isStretched*/ ctx[2]);
    			}

    			if (dirty & /*variant, classes, isRounded, undefined, $_theme*/ 4355) {
    				toggle_class(div, "button_rounded", /*isRounded*/ ctx[1] === undefined
    				? /*$_theme*/ ctx[12].isRounded
    				: /*isRounded*/ ctx[1]);
    			}

    			if (dirty & /*variant, classes, isActive*/ 265) {
    				toggle_class(div, "disabled", !/*isActive*/ ctx[3]);
    			}

    			if (dirty & /*variant, classes, isMarginHorizontal*/ 273) {
    				toggle_class(div, "margin_horizontal", /*isMarginHorizontal*/ ctx[4]);
    			}

    			if (dirty & /*variant, classes, isMarginVertical*/ 289) {
    				toggle_class(div, "margin_vertical", /*isMarginVertical*/ ctx[5]);
    			}

    			if (dirty & /*variant, classes, isHoverPointer*/ 321) {
    				toggle_class(div, "hover_pointer", /*isHoverPointer*/ ctx[6]);
    			}

    			if (dirty & /*variant, classes, clickAnimation*/ 1281) {
    				toggle_class(div, "click-animation", /*clickAnimation*/ ctx[10]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    exports.EButtonVariant = void 0;

    (function (EButtonVariant) {
    	EButtonVariant[EButtonVariant["outlined"] = 0] = "outlined";
    	EButtonVariant[EButtonVariant["outlined2"] = 1] = "outlined2";
    	EButtonVariant[EButtonVariant["filled"] = 2] = "filled";
    	EButtonVariant[EButtonVariant["text"] = 3] = "text";
    	EButtonVariant[EButtonVariant["text2"] = 4] = "text2";
    })(exports.EButtonVariant || (exports.EButtonVariant = {}));

    function instance$7($$self, $$props, $$invalidate) {
    	let $_theme;
    	component_subscribe($$self, _theme, $$value => $$invalidate(12, $_theme = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { variant = exports.EButtonVariant.outlined } = $$props;
    	let { isRounded } = $$props;
    	let { isStretched = false } = $$props;
    	let { isActive = true } = $$props;
    	let { isMarginHorizontal = false } = $$props;
    	let { isMarginVertical = false } = $$props;
    	let { isHoverPointer = false } = $$props;
    	let { minWidth = false } = $$props;
    	let { classes = '' } = $$props;
    	let { isClickAnimation = true } = $$props;
    	const dispatch = createEventDispatcher();
    	let clickAnimation = false;
    	let animationTimeout;

    	const click_handler = event => {
    		if (isActive) {
    			if (isClickAnimation) {
    				$$invalidate(10, clickAnimation = true);
    				clearTimeout(animationTimeout);

    				$$invalidate(11, animationTimeout = setTimeout(
    					() => {
    						$$invalidate(10, clickAnimation = false);
    						dispatch('click', event);
    					},
    					200
    				));
    			} else {
    				dispatch('click', event);
    			}
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('variant' in $$props) $$invalidate(0, variant = $$props.variant);
    		if ('isRounded' in $$props) $$invalidate(1, isRounded = $$props.isRounded);
    		if ('isStretched' in $$props) $$invalidate(2, isStretched = $$props.isStretched);
    		if ('isActive' in $$props) $$invalidate(3, isActive = $$props.isActive);
    		if ('isMarginHorizontal' in $$props) $$invalidate(4, isMarginHorizontal = $$props.isMarginHorizontal);
    		if ('isMarginVertical' in $$props) $$invalidate(5, isMarginVertical = $$props.isMarginVertical);
    		if ('isHoverPointer' in $$props) $$invalidate(6, isHoverPointer = $$props.isHoverPointer);
    		if ('minWidth' in $$props) $$invalidate(7, minWidth = $$props.minWidth);
    		if ('classes' in $$props) $$invalidate(8, classes = $$props.classes);
    		if ('isClickAnimation' in $$props) $$invalidate(9, isClickAnimation = $$props.isClickAnimation);
    		if ('$$scope' in $$props) $$invalidate(14, $$scope = $$props.$$scope);
    	};

    	return [
    		variant,
    		isRounded,
    		isStretched,
    		isActive,
    		isMarginHorizontal,
    		isMarginVertical,
    		isHoverPointer,
    		minWidth,
    		classes,
    		isClickAnimation,
    		clickAnimation,
    		animationTimeout,
    		$_theme,
    		dispatch,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class Button extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			variant: 0,
    			isRounded: 1,
    			isStretched: 2,
    			isActive: 3,
    			isMarginHorizontal: 4,
    			isMarginVertical: 5,
    			isHoverPointer: 6,
    			minWidth: 7,
    			classes: 8,
    			isClickAnimation: 9
    		});
    	}
    }

    /* src/UI/components/Switcher/Switcher.svelte generated by Svelte v3.46.4 */

    function create_fragment$6(ctx) {
    	let div;
    	let svg;
    	let path;
    	let path_d_value;
    	let svg_fill_value;
    	let interactiveElement_action;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "fill-rule", "evenodd");
    			attr(path, "clip-rule", "evenodd");
    			attr(path, "d", path_d_value = /*d*/ ctx[6][/*stateSwitch*/ ctx[3]]);
    			attr(svg, "width", "35");
    			attr(svg, "height", "16");
    			attr(svg, "viewBox", "0 0 35 16");
    			attr(svg, "fill", svg_fill_value = /*colors*/ ctx[7][/*stateSwitch*/ ctx[3]]);
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr(div, "class", "switcher noselect");
    			toggle_class(div, "disabled", !/*isActive*/ ctx[1]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, svg);
    			append(svg, path);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(interactiveElement_action = interactiveElement.call(null, div, {
    						isActive: /*$_theme*/ ctx[4].isInteractiveCursor && /*isActive*/ ctx[1]
    					})),
    					listen(div, "click", /*click_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*stateSwitch*/ 8 && path_d_value !== (path_d_value = /*d*/ ctx[6][/*stateSwitch*/ ctx[3]])) {
    				attr(path, "d", path_d_value);
    			}

    			if (dirty & /*stateSwitch*/ 8 && svg_fill_value !== (svg_fill_value = /*colors*/ ctx[7][/*stateSwitch*/ ctx[3]])) {
    				attr(svg, "fill", svg_fill_value);
    			}

    			if (interactiveElement_action && is_function(interactiveElement_action.update) && dirty & /*$_theme, isActive*/ 18) interactiveElement_action.update.call(null, {
    				isActive: /*$_theme*/ ctx[4].isInteractiveCursor && /*isActive*/ ctx[1]
    			});

    			if (dirty & /*isActive*/ 2) {
    				toggle_class(div, "disabled", !/*isActive*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $_theme;
    	component_subscribe($$self, _theme, $$value => $$invalidate(4, $_theme = $$value));
    	let { state } = $$props;
    	let { isActive = true } = $$props;
    	let { isBinding = false } = $$props;
    	const dispatch = createEventDispatcher();
    	let stateSwitch = 0;
    	let interval;
    	if (state) stateSwitch = 4;

    	const d = [
    		'M18.0736 10C16.7047 10 15.5579 10.9651 14.8492 12.1362C13.4476 14.4521 10.9046 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C10.9046 0 13.4476 1.54793 14.8492 3.86385C15.5579 5.03494 16.7047 6 18.0736 6H33C34.1046 6 35 6.89543 35 8C35 9.10457 34.1046 10 33 10H18.0736Z',
    		'M18.8492 3.86385C19.5579 5.03494 20.7047 6 22.0736 6H33C34.1046 6 35 6.89543 35 8V8C35 9.10457 34.1046 10 33 10H22.0736C20.7047 10 19.5579 10.9651 18.8492 12.1362C17.4476 14.4521 14.9046 16 12 16C8.92802 16 6.26046 14.2685 4.92001 11.7282C4.40997 10.7616 3.48813 10 2.39523 10H2C0.89543 10 0 9.10457 0 8V8C0 6.89543 0.89543 6 2 6H2.39523C3.48813 6 4.40997 5.23837 4.92001 4.27179C6.26046 1.7315 8.92802 0 12 0C14.9046 0 17.4476 1.54793 18.8492 3.86385Z',
    		'M24.8492 3.86385C25.5579 5.03494 26.7047 6 28.0736 6H33C34.1046 6 35 6.89543 35 8C35 9.10457 34.1046 10 33 10H28.0736C26.7047 10 25.5579 10.9651 24.8492 12.1362C23.4476 14.4521 20.9046 16 18 16C15.0954 16 12.5524 14.4521 11.1508 12.1362C10.4421 10.9651 9.29526 10 7.92641 10H2C0.895429 10 0 9.10457 0 8C0 6.89543 0.89543 6 2 6H7.92641C9.29526 6 10.4421 5.03494 11.1508 3.86385C12.5524 1.54793 15.0954 0 18 0C20.9046 0 23.4476 1.54793 24.8492 3.86385Z',
    		'M30.08 4.27179C30.59 5.23837 31.5119 6 32.6048 6H33C34.1046 6 35 6.89543 35 8V8C35 9.10457 34.1046 10 33 10H32.6048C31.5119 10 30.59 10.7616 30.08 11.7282C28.7395 14.2685 26.072 16 23 16C20.0954 16 17.5524 14.4521 16.1508 12.1362C15.4421 10.9651 14.2953 10 12.9264 10H2C0.89543 10 0 9.10457 0 8V8C0 6.89543 0.895431 6 2 6H12.9264C14.2953 6 15.4421 5.03494 16.1508 3.86385C17.5524 1.54793 20.0954 0 23 0C26.072 0 28.7395 1.7315 30.08 4.27179Z',
    		'M27 16C31.4183 16 35 12.4183 35 8C35 3.58172 31.4183 0 27 0C24.0954 0 21.5524 1.54793 20.1508 3.86385C19.4421 5.03494 18.2953 6 16.9264 6H2C0.895431 6 0 6.89543 0 8C0 9.10457 0.895433 10 2 10H16.9264C18.2953 10 19.4421 10.9651 20.1508 12.1362C21.5524 14.4521 24.0954 16 27 16Z'
    	];

    	const colors = [
    		'var(--line-4)',
    		'var(--line-4)',
    		'var(--line-4)',
    		'var(--contrast-6)',
    		'var(--contrast-6)'
    	];

    	function ChangeState() {
    		if (state) {
    			if (stateSwitch < 4) {
    				interval = setInterval(
    					() => {
    						if (stateSwitch < 4) $$invalidate(3, stateSwitch++, stateSwitch); else clearInterval(interval);
    					},
    					20
    				);
    			}
    		} else {
    			if (stateSwitch > 0) {
    				interval = setInterval(
    					() => {
    						if (stateSwitch > 0) $$invalidate(3, stateSwitch--, stateSwitch); else clearInterval(interval);
    					},
    					20
    				);
    			}
    		}
    	}

    	const click_handler = () => {
    		if (isActive) {
    			if (isBinding) $$invalidate(0, state = !state);
    			dispatch('change', state);
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    		if ('isActive' in $$props) $$invalidate(1, isActive = $$props.isActive);
    		if ('isBinding' in $$props) $$invalidate(2, isBinding = $$props.isBinding);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*state*/ 1) {
    			(ChangeState());
    		}
    	};

    	return [
    		state,
    		isActive,
    		isBinding,
    		stateSwitch,
    		$_theme,
    		dispatch,
    		d,
    		colors,
    		click_handler
    	];
    }

    class Switcher extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { state: 0, isActive: 1, isBinding: 2 });
    	}
    }

    /* src/UI/components/Loader/Loader.svelte generated by Svelte v3.46.4 */

    function create_fragment$5(ctx) {
    	let div4;

    	return {
    		c() {
    			div4 = element("div");

    			div4.innerHTML = `<div></div> 
    <div></div> 
    <div></div> 
    <div></div>`;

    			attr(div4, "class", "loader");
    			toggle_class(div4, "contrast", /*isContrast*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, div4, anchor);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*isContrast*/ 1) {
    				toggle_class(div4, "contrast", /*isContrast*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div4);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { isContrast = false } = $$props;

    	$$self.$$set = $$props => {
    		if ('isContrast' in $$props) $$invalidate(0, isContrast = $$props.isContrast);
    	};

    	return [isContrast];
    }

    class Loader extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { isContrast: 0 });
    	}
    }

    /* src/UI/components/Checkbox/Checkbox.svelte generated by Svelte v3.46.4 */

    function create_if_block$3(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "d", "M1.5 6.5L6.58824 11L14.5 1");
    			attr(path, "stroke-width", "2");
    			attr(path, "stroke-linecap", "round");
    			attr(path, "stroke-linejoin", "round");
    			attr(svg, "width", "16");
    			attr(svg, "height", "12");
    			attr(svg, "viewBox", "0 0 16 12");
    			attr(svg, "fill", "none");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    function create_fragment$4(ctx) {
    	let div;
    	let mounted;
    	let dispose;
    	let if_block = /*state*/ ctx[0] && create_if_block$3();

    	return {
    		c() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr(div, "class", "checkbox");
    			toggle_class(div, "outlined", /*isOutlined*/ ctx[2]);
    			toggle_class(div, "disabled", !/*isActive*/ ctx[1]);
    			toggle_class(div, "checked", /*state*/ ctx[0]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block) if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen(div, "click", /*click_handler*/ ctx[4]);
    				mounted = true;
    			}
    		},
    		p(ctx, [dirty]) {
    			if (/*state*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block$3();
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*isOutlined*/ 4) {
    				toggle_class(div, "outlined", /*isOutlined*/ ctx[2]);
    			}

    			if (dirty & /*isActive*/ 2) {
    				toggle_class(div, "disabled", !/*isActive*/ ctx[1]);
    			}

    			if (dirty & /*state*/ 1) {
    				toggle_class(div, "checked", /*state*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { state } = $$props;
    	let { isActive = true } = $$props;
    	let { isOutlined = false } = $$props;
    	const dispatch = createEventDispatcher();

    	const click_handler = () => {
    		if (isActive) {
    			$$invalidate(0, state = !state);
    			dispatch('change', state);
    		}
    	};

    	$$self.$$set = $$props => {
    		if ('state' in $$props) $$invalidate(0, state = $$props.state);
    		if ('isActive' in $$props) $$invalidate(1, isActive = $$props.isActive);
    		if ('isOutlined' in $$props) $$invalidate(2, isOutlined = $$props.isOutlined);
    	};

    	return [state, isActive, isOutlined, dispatch, click_handler];
    }

    class Checkbox extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { state: 0, isActive: 1, isOutlined: 2 });
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getAugmentedNamespace(n) {
    	if (n.__esModule) return n;
    	var a = Object.defineProperty({}, '__esModule', {value: true});
    	Object.keys(n).forEach(function (k) {
    		var d = Object.getOwnPropertyDescriptor(n, k);
    		Object.defineProperty(a, k, d.get ? d : {
    			enumerable: true,
    			get: function () {
    				return n[k];
    			}
    		});
    	});
    	return a;
    }

    var svelteImask = {exports: {}};

    function _typeof(obj) {
      "@babel/helpers - typeof";

      if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function (obj) {
          return typeof obj;
        };
      } else {
        _typeof = function (obj) {
          return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
      }

      return _typeof(obj);
    }

    function _classCallCheck(instance, Constructor) {
      if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
      }
    }

    function _defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    function _createClass(Constructor, protoProps, staticProps) {
      if (protoProps) _defineProperties(Constructor.prototype, protoProps);
      if (staticProps) _defineProperties(Constructor, staticProps);
      return Constructor;
    }

    function _defineProperty(obj, key, value) {
      if (key in obj) {
        Object.defineProperty(obj, key, {
          value: value,
          enumerable: true,
          configurable: true,
          writable: true
        });
      } else {
        obj[key] = value;
      }

      return obj;
    }

    function _inherits(subClass, superClass) {
      if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function");
      }

      subClass.prototype = Object.create(superClass && superClass.prototype, {
        constructor: {
          value: subClass,
          writable: true,
          configurable: true
        }
      });
      if (superClass) _setPrototypeOf(subClass, superClass);
    }

    function _getPrototypeOf(o) {
      _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
      return _getPrototypeOf(o);
    }

    function _setPrototypeOf(o, p) {
      _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
        o.__proto__ = p;
        return o;
      };

      return _setPrototypeOf(o, p);
    }

    function _isNativeReflectConstruct() {
      if (typeof Reflect === "undefined" || !Reflect.construct) return false;
      if (Reflect.construct.sham) return false;
      if (typeof Proxy === "function") return true;

      try {
        Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
        return true;
      } catch (e) {
        return false;
      }
    }

    function _objectWithoutPropertiesLoose(source, excluded) {
      if (source == null) return {};
      var target = {};
      var sourceKeys = Object.keys(source);
      var key, i;

      for (i = 0; i < sourceKeys.length; i++) {
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
      }

      return target;
    }

    function _objectWithoutProperties(source, excluded) {
      if (source == null) return {};

      var target = _objectWithoutPropertiesLoose(source, excluded);

      var key, i;

      if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);

        for (i = 0; i < sourceSymbolKeys.length; i++) {
          key = sourceSymbolKeys[i];
          if (excluded.indexOf(key) >= 0) continue;
          if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
          target[key] = source[key];
        }
      }

      return target;
    }

    function _assertThisInitialized(self) {
      if (self === void 0) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      }

      return self;
    }

    function _possibleConstructorReturn(self, call) {
      if (call && (typeof call === "object" || typeof call === "function")) {
        return call;
      } else if (call !== void 0) {
        throw new TypeError("Derived constructors may only return object or undefined");
      }

      return _assertThisInitialized(self);
    }

    function _createSuper(Derived) {
      var hasNativeReflectConstruct = _isNativeReflectConstruct();

      return function _createSuperInternal() {
        var Super = _getPrototypeOf(Derived),
            result;

        if (hasNativeReflectConstruct) {
          var NewTarget = _getPrototypeOf(this).constructor;

          result = Reflect.construct(Super, arguments, NewTarget);
        } else {
          result = Super.apply(this, arguments);
        }

        return _possibleConstructorReturn(this, result);
      };
    }

    function _superPropBase(object, property) {
      while (!Object.prototype.hasOwnProperty.call(object, property)) {
        object = _getPrototypeOf(object);
        if (object === null) break;
      }

      return object;
    }

    function _get(target, property, receiver) {
      if (typeof Reflect !== "undefined" && Reflect.get) {
        _get = Reflect.get;
      } else {
        _get = function _get(target, property, receiver) {
          var base = _superPropBase(target, property);

          if (!base) return;
          var desc = Object.getOwnPropertyDescriptor(base, property);

          if (desc.get) {
            return desc.get.call(receiver);
          }

          return desc.value;
        };
      }

      return _get(target, property, receiver || target);
    }

    function set(target, property, value, receiver) {
      if (typeof Reflect !== "undefined" && Reflect.set) {
        set = Reflect.set;
      } else {
        set = function set(target, property, value, receiver) {
          var base = _superPropBase(target, property);

          var desc;

          if (base) {
            desc = Object.getOwnPropertyDescriptor(base, property);

            if (desc.set) {
              desc.set.call(receiver, value);
              return true;
            } else if (!desc.writable) {
              return false;
            }
          }

          desc = Object.getOwnPropertyDescriptor(receiver, property);

          if (desc) {
            if (!desc.writable) {
              return false;
            }

            desc.value = value;
            Object.defineProperty(receiver, property, desc);
          } else {
            _defineProperty(receiver, property, value);
          }

          return true;
        };
      }

      return set(target, property, value, receiver);
    }

    function _set(target, property, value, receiver, isStrict) {
      var s = set(target, property, value, receiver || target);

      if (!s && isStrict) {
        throw new Error('failed to set property');
      }

      return value;
    }

    function _slicedToArray(arr, i) {
      return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
    }

    function _arrayWithHoles(arr) {
      if (Array.isArray(arr)) return arr;
    }

    function _iterableToArrayLimit(arr, i) {
      var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"];

      if (_i == null) return;
      var _arr = [];
      var _n = true;
      var _d = false;

      var _s, _e;

      try {
        for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
          _arr.push(_s.value);

          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i["return"] != null) _i["return"]();
        } finally {
          if (_d) throw _e;
        }
      }

      return _arr;
    }

    function _unsupportedIterableToArray(o, minLen) {
      if (!o) return;
      if (typeof o === "string") return _arrayLikeToArray(o, minLen);
      var n = Object.prototype.toString.call(o).slice(8, -1);
      if (n === "Object" && o.constructor) n = o.constructor.name;
      if (n === "Map" || n === "Set") return Array.from(o);
      if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
    }

    function _arrayLikeToArray(arr, len) {
      if (len == null || len > arr.length) len = arr.length;

      for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

      return arr2;
    }

    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    /** Checks if value is string */
    function isString(str) {
      return typeof str === 'string' || str instanceof String;
    }
    /**
      Direction
      @prop {string} NONE
      @prop {string} LEFT
      @prop {string} FORCE_LEFT
      @prop {string} RIGHT
      @prop {string} FORCE_RIGHT
    */

    var DIRECTION = {
      NONE: 'NONE',
      LEFT: 'LEFT',
      FORCE_LEFT: 'FORCE_LEFT',
      RIGHT: 'RIGHT',
      FORCE_RIGHT: 'FORCE_RIGHT'
    };
    /** */

    function forceDirection(direction) {
      switch (direction) {
        case DIRECTION.LEFT:
          return DIRECTION.FORCE_LEFT;

        case DIRECTION.RIGHT:
          return DIRECTION.FORCE_RIGHT;

        default:
          return direction;
      }
    }
    /** Escapes regular expression control chars */

    function escapeRegExp(str) {
      return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
    } // cloned from https://github.com/epoberezkin/fast-deep-equal with small changes

    function objectIncludes(b, a) {
      if (a === b) return true;
      var arrA = Array.isArray(a),
          arrB = Array.isArray(b),
          i;

      if (arrA && arrB) {
        if (a.length != b.length) return false;

        for (i = 0; i < a.length; i++) {
          if (!objectIncludes(a[i], b[i])) return false;
        }

        return true;
      }

      if (arrA != arrB) return false;

      if (a && b && _typeof(a) === 'object' && _typeof(b) === 'object') {
        var dateA = a instanceof Date,
            dateB = b instanceof Date;
        if (dateA && dateB) return a.getTime() == b.getTime();
        if (dateA != dateB) return false;
        var regexpA = a instanceof RegExp,
            regexpB = b instanceof RegExp;
        if (regexpA && regexpB) return a.toString() == b.toString();
        if (regexpA != regexpB) return false;
        var keys = Object.keys(a); // if (keys.length !== Object.keys(b).length) return false;

        for (i = 0; i < keys.length; i++) {
          if (!Object.prototype.hasOwnProperty.call(b, keys[i])) return false;
        }

        for (i = 0; i < keys.length; i++) {
          if (!objectIncludes(b[keys[i]], a[keys[i]])) return false;
        }

        return true;
      } else if (a && b && typeof a === 'function' && typeof b === 'function') {
        return a.toString() === b.toString();
      }

      return false;
    }

    /** Provides details of changing input */

    var ActionDetails = /*#__PURE__*/function () {
      /** Current input value */

      /** Current cursor position */

      /** Old input value */

      /** Old selection */
      function ActionDetails(value, cursorPos, oldValue, oldSelection) {
        _classCallCheck(this, ActionDetails);

        this.value = value;
        this.cursorPos = cursorPos;
        this.oldValue = oldValue;
        this.oldSelection = oldSelection; // double check if left part was changed (autofilling, other non-standard input triggers)

        while (this.value.slice(0, this.startChangePos) !== this.oldValue.slice(0, this.startChangePos)) {
          --this.oldSelection.start;
        }
      }
      /**
        Start changing position
        @readonly
      */


      _createClass(ActionDetails, [{
        key: "startChangePos",
        get: function get() {
          return Math.min(this.cursorPos, this.oldSelection.start);
        }
        /**
          Inserted symbols count
          @readonly
        */

      }, {
        key: "insertedCount",
        get: function get() {
          return this.cursorPos - this.startChangePos;
        }
        /**
          Inserted symbols
          @readonly
        */

      }, {
        key: "inserted",
        get: function get() {
          return this.value.substr(this.startChangePos, this.insertedCount);
        }
        /**
          Removed symbols count
          @readonly
        */

      }, {
        key: "removedCount",
        get: function get() {
          // Math.max for opposite operation
          return Math.max(this.oldSelection.end - this.startChangePos || // for Delete
          this.oldValue.length - this.value.length, 0);
        }
        /**
          Removed symbols
          @readonly
        */

      }, {
        key: "removed",
        get: function get() {
          return this.oldValue.substr(this.startChangePos, this.removedCount);
        }
        /**
          Unchanged head symbols
          @readonly
        */

      }, {
        key: "head",
        get: function get() {
          return this.value.substring(0, this.startChangePos);
        }
        /**
          Unchanged tail symbols
          @readonly
        */

      }, {
        key: "tail",
        get: function get() {
          return this.value.substring(this.startChangePos + this.insertedCount);
        }
        /**
          Remove direction
          @readonly
        */

      }, {
        key: "removeDirection",
        get: function get() {
          if (!this.removedCount || this.insertedCount) return DIRECTION.NONE; // align right if delete at right or if range removed (event with backspace)

          return this.oldSelection.end === this.cursorPos || this.oldSelection.start === this.cursorPos ? DIRECTION.RIGHT : DIRECTION.LEFT;
        }
      }]);

      return ActionDetails;
    }();

    /**
      Provides details of changing model value
      @param {Object} [details]
      @param {string} [details.inserted] - Inserted symbols
      @param {boolean} [details.skip] - Can skip chars
      @param {number} [details.removeCount] - Removed symbols count
      @param {number} [details.tailShift] - Additional offset if any changes occurred before tail
    */
    var ChangeDetails = /*#__PURE__*/function () {
      /** Inserted symbols */

      /** Can skip chars */

      /** Additional offset if any changes occurred before tail */

      /** Raw inserted is used by dynamic mask */
      function ChangeDetails(details) {
        _classCallCheck(this, ChangeDetails);

        Object.assign(this, {
          inserted: '',
          rawInserted: '',
          skip: false,
          tailShift: 0
        }, details);
      }
      /**
        Aggregate changes
        @returns {ChangeDetails} `this`
      */


      _createClass(ChangeDetails, [{
        key: "aggregate",
        value: function aggregate(details) {
          this.rawInserted += details.rawInserted;
          this.skip = this.skip || details.skip;
          this.inserted += details.inserted;
          this.tailShift += details.tailShift;
          return this;
        }
        /** Total offset considering all changes */

      }, {
        key: "offset",
        get: function get() {
          return this.tailShift + this.inserted.length;
        }
      }]);

      return ChangeDetails;
    }();

    /** Provides details of continuous extracted tail */
    var ContinuousTailDetails = /*#__PURE__*/function () {
      /** Tail value as string */

      /** Tail start position */

      /** Start position */
      function ContinuousTailDetails() {
        var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
        var from = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
        var stop = arguments.length > 2 ? arguments[2] : undefined;

        _classCallCheck(this, ContinuousTailDetails);

        this.value = value;
        this.from = from;
        this.stop = stop;
      }

      _createClass(ContinuousTailDetails, [{
        key: "toString",
        value: function toString() {
          return this.value;
        }
      }, {
        key: "extend",
        value: function extend(tail) {
          this.value += String(tail);
        }
      }, {
        key: "appendTo",
        value: function appendTo(masked) {
          return masked.append(this.toString(), {
            tail: true
          }).aggregate(masked._appendPlaceholder());
        }
      }, {
        key: "state",
        get: function get() {
          return {
            value: this.value,
            from: this.from,
            stop: this.stop
          };
        },
        set: function set(state) {
          Object.assign(this, state);
        }
      }, {
        key: "shiftBefore",
        value: function shiftBefore(pos) {
          if (this.from >= pos || !this.value.length) return '';
          var shiftChar = this.value[0];
          this.value = this.value.slice(1);
          return shiftChar;
        }
      }]);

      return ContinuousTailDetails;
    }();

    /**
     * Applies mask on element.
     * @constructor
     * @param {HTMLInputElement|HTMLTextAreaElement|MaskElement} el - Element to apply mask
     * @param {Object} opts - Custom mask options
     * @return {InputMask}
     */
    function IMask(el) {
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      // currently available only for input-like elements
      return new IMask.InputMask(el, opts);
    }

    /** Supported mask type */

    /** Provides common masking stuff */
    var Masked = /*#__PURE__*/function () {
      // $Shape<MaskedOptions>; TODO after fix https://github.com/facebook/flow/issues/4773

      /** @type {Mask} */

      /** */
      // $FlowFixMe no ideas

      /** Transforms value before mask processing */

      /** Validates if value is acceptable */

      /** Does additional processing in the end of editing */

      /** Format typed value to string */

      /** Parse strgin to get typed value */

      /** Enable characters overwriting */

      /** */
      function Masked(opts) {
        _classCallCheck(this, Masked);

        this._value = '';

        this._update(Object.assign({}, Masked.DEFAULTS, opts));

        this.isInitialized = true;
      }
      /** Sets and applies new options */


      _createClass(Masked, [{
        key: "updateOptions",
        value: function updateOptions(opts) {
          if (!Object.keys(opts).length) return;
          this.withValueRefresh(this._update.bind(this, opts));
        }
        /**
          Sets new options
          @protected
        */

      }, {
        key: "_update",
        value: function _update(opts) {
          Object.assign(this, opts);
        }
        /** Mask state */

      }, {
        key: "state",
        get: function get() {
          return {
            _value: this.value
          };
        },
        set: function set(state) {
          this._value = state._value;
        }
        /** Resets value */

      }, {
        key: "reset",
        value: function reset() {
          this._value = '';
        }
        /** */

      }, {
        key: "value",
        get: function get() {
          return this._value;
        },
        set: function set(value) {
          this.resolve(value);
        }
        /** Resolve new value */

      }, {
        key: "resolve",
        value: function resolve(value) {
          this.reset();
          this.append(value, {
            input: true
          }, '');
          this.doCommit();
          return this.value;
        }
        /** */

      }, {
        key: "unmaskedValue",
        get: function get() {
          return this.value;
        },
        set: function set(value) {
          this.reset();
          this.append(value, {}, '');
          this.doCommit();
        }
        /** */

      }, {
        key: "typedValue",
        get: function get() {
          return this.doParse(this.value);
        },
        set: function set(value) {
          this.value = this.doFormat(value);
        }
        /** Value that includes raw user input */

      }, {
        key: "rawInputValue",
        get: function get() {
          return this.extractInput(0, this.value.length, {
            raw: true
          });
        },
        set: function set(value) {
          this.reset();
          this.append(value, {
            raw: true
          }, '');
          this.doCommit();
        }
        /** */

      }, {
        key: "isComplete",
        get: function get() {
          return true;
        }
        /** Finds nearest input position in direction */

      }, {
        key: "nearestInputPos",
        value: function nearestInputPos(cursorPos, direction) {
          return cursorPos;
        }
        /** Extracts value in range considering flags */

      }, {
        key: "extractInput",
        value: function extractInput() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          return this.value.slice(fromPos, toPos);
        }
        /** Extracts tail in range */

      }, {
        key: "extractTail",
        value: function extractTail() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          return new ContinuousTailDetails(this.extractInput(fromPos, toPos), fromPos);
        }
        /** Appends tail */
        // $FlowFixMe no ideas

      }, {
        key: "appendTail",
        value: function appendTail(tail) {
          if (isString(tail)) tail = new ContinuousTailDetails(String(tail));
          return tail.appendTo(this);
        }
        /** Appends char */

      }, {
        key: "_appendCharRaw",
        value: function _appendCharRaw(ch) {
          if (!ch) return new ChangeDetails();
          this._value += ch;
          return new ChangeDetails({
            inserted: ch,
            rawInserted: ch
          });
        }
        /** Appends char */

      }, {
        key: "_appendChar",
        value: function _appendChar(ch) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          var checkTail = arguments.length > 2 ? arguments[2] : undefined;
          var consistentState = this.state;

          var details = this._appendCharRaw(this.doPrepare(ch, flags), flags);

          if (details.inserted) {
            var consistentTail;
            var appended = this.doValidate(flags) !== false;

            if (appended && checkTail != null) {
              // validation ok, check tail
              var beforeTailState = this.state;

              if (this.overwrite) {
                consistentTail = checkTail.state;
                checkTail.shiftBefore(this.value.length);
              }

              var tailDetails = this.appendTail(checkTail);
              appended = tailDetails.rawInserted === checkTail.toString(); // if ok, rollback state after tail

              if (appended && tailDetails.inserted) this.state = beforeTailState;
            } // revert all if something went wrong


            if (!appended) {
              details = new ChangeDetails();
              this.state = consistentState;
              if (checkTail && consistentTail) checkTail.state = consistentTail;
            }
          }

          return details;
        }
        /** Appends optional placeholder at end */

      }, {
        key: "_appendPlaceholder",
        value: function _appendPlaceholder() {
          return new ChangeDetails();
        }
        /** Appends symbols considering flags */
        // $FlowFixMe no ideas

      }, {
        key: "append",
        value: function append(str, flags, tail) {
          if (!isString(str)) throw new Error('value should be string');
          var details = new ChangeDetails();
          var checkTail = isString(tail) ? new ContinuousTailDetails(String(tail)) : tail;
          if (flags && flags.tail) flags._beforeTailState = this.state;

          for (var ci = 0; ci < str.length; ++ci) {
            details.aggregate(this._appendChar(str[ci], flags, checkTail));
          } // append tail but aggregate only tailShift


          if (checkTail != null) {
            details.tailShift += this.appendTail(checkTail).tailShift; // TODO it's a good idea to clear state after appending ends
            // but it causes bugs when one append calls another (when dynamic dispatch set rawInputValue)
            // this._resetBeforeTailState();
          }

          return details;
        }
        /** */

      }, {
        key: "remove",
        value: function remove() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          this._value = this.value.slice(0, fromPos) + this.value.slice(toPos);
          return new ChangeDetails();
        }
        /** Calls function and reapplies current value */

      }, {
        key: "withValueRefresh",
        value: function withValueRefresh(fn) {
          if (this._refreshing || !this.isInitialized) return fn();
          this._refreshing = true;
          var rawInput = this.rawInputValue;
          var value = this.value;
          var ret = fn();
          this.rawInputValue = rawInput; // append lost trailing chars at end

          if (this.value && this.value !== value && value.indexOf(this.value) === 0) {
            this.append(value.slice(this.value.length), {}, '');
          }

          delete this._refreshing;
          return ret;
        }
        /** */

      }, {
        key: "runIsolated",
        value: function runIsolated(fn) {
          if (this._isolated || !this.isInitialized) return fn(this);
          this._isolated = true;
          var state = this.state;
          var ret = fn(this);
          this.state = state;
          delete this._isolated;
          return ret;
        }
        /**
          Prepares string before mask processing
          @protected
        */

      }, {
        key: "doPrepare",
        value: function doPrepare(str) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          return this.prepare ? this.prepare(str, this, flags) : str;
        }
        /**
          Validates if value is acceptable
          @protected
        */

      }, {
        key: "doValidate",
        value: function doValidate(flags) {
          return (!this.validate || this.validate(this.value, this, flags)) && (!this.parent || this.parent.doValidate(flags));
        }
        /**
          Does additional processing in the end of editing
          @protected
        */

      }, {
        key: "doCommit",
        value: function doCommit() {
          if (this.commit) this.commit(this.value, this);
        }
        /** */

      }, {
        key: "doFormat",
        value: function doFormat(value) {
          return this.format ? this.format(value, this) : value;
        }
        /** */

      }, {
        key: "doParse",
        value: function doParse(str) {
          return this.parse ? this.parse(str, this) : str;
        }
        /** */

      }, {
        key: "splice",
        value: function splice(start, deleteCount, inserted, removeDirection) {
          var tailPos = start + deleteCount;
          var tail = this.extractTail(tailPos);
          var startChangePos = this.nearestInputPos(start, removeDirection);
          var changeDetails = new ChangeDetails({
            tailShift: startChangePos - start // adjust tailShift if start was aligned

          }).aggregate(this.remove(startChangePos)).aggregate(this.append(inserted, {
            input: true
          }, tail));
          return changeDetails;
        }
      }]);

      return Masked;
    }();
    Masked.DEFAULTS = {
      format: function format(v) {
        return v;
      },
      parse: function parse(v) {
        return v;
      }
    };
    IMask.Masked = Masked;

    /** Get Masked class by mask type */

    function maskedClass(mask) {
      if (mask == null) {
        throw new Error('mask property should be defined');
      } // $FlowFixMe


      if (mask instanceof RegExp) return IMask.MaskedRegExp; // $FlowFixMe

      if (isString(mask)) return IMask.MaskedPattern; // $FlowFixMe

      if (mask instanceof Date || mask === Date) return IMask.MaskedDate; // $FlowFixMe

      if (mask instanceof Number || typeof mask === 'number' || mask === Number) return IMask.MaskedNumber; // $FlowFixMe

      if (Array.isArray(mask) || mask === Array) return IMask.MaskedDynamic; // $FlowFixMe

      if (IMask.Masked && mask.prototype instanceof IMask.Masked) return mask; // $FlowFixMe

      if (mask instanceof Function) return IMask.MaskedFunction; // $FlowFixMe

      if (mask instanceof IMask.Masked) return mask.constructor;
      console.warn('Mask not found for mask', mask); // eslint-disable-line no-console
      // $FlowFixMe

      return IMask.Masked;
    }
    /** Creates new {@link Masked} depending on mask type */

    function createMask(opts) {
      // $FlowFixMe
      if (IMask.Masked && opts instanceof IMask.Masked) return opts;
      opts = Object.assign({}, opts);
      var mask = opts.mask; // $FlowFixMe

      if (IMask.Masked && mask instanceof IMask.Masked) return mask;
      var MaskedClass = maskedClass(mask);
      if (!MaskedClass) throw new Error('Masked class is not found for provided mask, appropriate module needs to be import manually before creating mask.');
      return new MaskedClass(opts);
    }
    IMask.createMask = createMask;

    var _excluded$4 = ["mask"];
    var DEFAULT_INPUT_DEFINITIONS = {
      '0': /\d/,
      'a': /[\u0041-\u005A\u0061-\u007A\u00AA\u00B5\u00BA\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
      // http://stackoverflow.com/a/22075070
      '*': /./
    };
    /** */

    var PatternInputDefinition = /*#__PURE__*/function () {
      /** */

      /** */

      /** */

      /** */

      /** */

      /** */
      function PatternInputDefinition(opts) {
        _classCallCheck(this, PatternInputDefinition);

        var mask = opts.mask,
            blockOpts = _objectWithoutProperties(opts, _excluded$4);

        this.masked = createMask({
          mask: mask
        });
        Object.assign(this, blockOpts);
      }

      _createClass(PatternInputDefinition, [{
        key: "reset",
        value: function reset() {
          this._isFilled = false;
          this.masked.reset();
        }
      }, {
        key: "remove",
        value: function remove() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;

          if (fromPos === 0 && toPos >= 1) {
            this._isFilled = false;
            return this.masked.remove(fromPos, toPos);
          }

          return new ChangeDetails();
        }
      }, {
        key: "value",
        get: function get() {
          return this.masked.value || (this._isFilled && !this.isOptional ? this.placeholderChar : '');
        }
      }, {
        key: "unmaskedValue",
        get: function get() {
          return this.masked.unmaskedValue;
        }
      }, {
        key: "isComplete",
        get: function get() {
          return Boolean(this.masked.value) || this.isOptional;
        }
      }, {
        key: "_appendChar",
        value: function _appendChar(str) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          if (this._isFilled) return new ChangeDetails();
          var state = this.masked.state; // simulate input

          var details = this.masked._appendChar(str, flags);

          if (details.inserted && this.doValidate(flags) === false) {
            details.inserted = details.rawInserted = '';
            this.masked.state = state;
          }

          if (!details.inserted && !this.isOptional && !this.lazy && !flags.input) {
            details.inserted = this.placeholderChar;
          }

          details.skip = !details.inserted && !this.isOptional;
          this._isFilled = Boolean(details.inserted);
          return details;
        }
      }, {
        key: "append",
        value: function append() {
          var _this$masked;

          return (_this$masked = this.masked).append.apply(_this$masked, arguments);
        }
      }, {
        key: "_appendPlaceholder",
        value: function _appendPlaceholder() {
          var details = new ChangeDetails();
          if (this._isFilled || this.isOptional) return details;
          this._isFilled = true;
          details.inserted = this.placeholderChar;
          return details;
        }
      }, {
        key: "extractTail",
        value: function extractTail() {
          var _this$masked2;

          return (_this$masked2 = this.masked).extractTail.apply(_this$masked2, arguments);
        }
      }, {
        key: "appendTail",
        value: function appendTail() {
          var _this$masked3;

          return (_this$masked3 = this.masked).appendTail.apply(_this$masked3, arguments);
        }
      }, {
        key: "extractInput",
        value: function extractInput() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          var flags = arguments.length > 2 ? arguments[2] : undefined;
          return this.masked.extractInput(fromPos, toPos, flags);
        }
      }, {
        key: "nearestInputPos",
        value: function nearestInputPos(cursorPos) {
          var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DIRECTION.NONE;
          var minPos = 0;
          var maxPos = this.value.length;
          var boundPos = Math.min(Math.max(cursorPos, minPos), maxPos);

          switch (direction) {
            case DIRECTION.LEFT:
            case DIRECTION.FORCE_LEFT:
              return this.isComplete ? boundPos : minPos;

            case DIRECTION.RIGHT:
            case DIRECTION.FORCE_RIGHT:
              return this.isComplete ? boundPos : maxPos;

            case DIRECTION.NONE:
            default:
              return boundPos;
          }
        }
      }, {
        key: "doValidate",
        value: function doValidate() {
          var _this$masked4, _this$parent;

          return (_this$masked4 = this.masked).doValidate.apply(_this$masked4, arguments) && (!this.parent || (_this$parent = this.parent).doValidate.apply(_this$parent, arguments));
        }
      }, {
        key: "doCommit",
        value: function doCommit() {
          this.masked.doCommit();
        }
      }, {
        key: "state",
        get: function get() {
          return {
            masked: this.masked.state,
            _isFilled: this._isFilled
          };
        },
        set: function set(state) {
          this.masked.state = state.masked;
          this._isFilled = state._isFilled;
        }
      }]);

      return PatternInputDefinition;
    }();

    var PatternFixedDefinition = /*#__PURE__*/function () {
      /** */

      /** */

      /** */

      /** */
      function PatternFixedDefinition(opts) {
        _classCallCheck(this, PatternFixedDefinition);

        Object.assign(this, opts);
        this._value = '';
      }

      _createClass(PatternFixedDefinition, [{
        key: "value",
        get: function get() {
          return this._value;
        }
      }, {
        key: "unmaskedValue",
        get: function get() {
          return this.isUnmasking ? this.value : '';
        }
      }, {
        key: "reset",
        value: function reset() {
          this._isRawInput = false;
          this._value = '';
        }
      }, {
        key: "remove",
        value: function remove() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._value.length;
          this._value = this._value.slice(0, fromPos) + this._value.slice(toPos);
          if (!this._value) this._isRawInput = false;
          return new ChangeDetails();
        }
      }, {
        key: "nearestInputPos",
        value: function nearestInputPos(cursorPos) {
          var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DIRECTION.NONE;
          var minPos = 0;
          var maxPos = this._value.length;

          switch (direction) {
            case DIRECTION.LEFT:
            case DIRECTION.FORCE_LEFT:
              return minPos;

            case DIRECTION.NONE:
            case DIRECTION.RIGHT:
            case DIRECTION.FORCE_RIGHT:
            default:
              return maxPos;
          }
        }
      }, {
        key: "extractInput",
        value: function extractInput() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this._value.length;
          var flags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
          return flags.raw && this._isRawInput && this._value.slice(fromPos, toPos) || '';
        }
      }, {
        key: "isComplete",
        get: function get() {
          return true;
        }
      }, {
        key: "_appendChar",
        value: function _appendChar(str) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          var details = new ChangeDetails();
          if (this._value) return details;
          var appended = this.char === str[0];
          var isResolved = appended && (this.isUnmasking || flags.input || flags.raw) && !flags.tail;
          if (isResolved) details.rawInserted = this.char;
          this._value = details.inserted = this.char;
          this._isRawInput = isResolved && (flags.raw || flags.input);
          return details;
        }
      }, {
        key: "_appendPlaceholder",
        value: function _appendPlaceholder() {
          var details = new ChangeDetails();
          if (this._value) return details;
          this._value = details.inserted = this.char;
          return details;
        }
      }, {
        key: "extractTail",
        value: function extractTail() {
          arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          return new ContinuousTailDetails('');
        } // $FlowFixMe no ideas

      }, {
        key: "appendTail",
        value: function appendTail(tail) {
          if (isString(tail)) tail = new ContinuousTailDetails(String(tail));
          return tail.appendTo(this);
        }
      }, {
        key: "append",
        value: function append(str, flags, tail) {
          var details = this._appendChar(str, flags);

          if (tail != null) {
            details.tailShift += this.appendTail(tail).tailShift;
          }

          return details;
        }
      }, {
        key: "doCommit",
        value: function doCommit() {}
      }, {
        key: "state",
        get: function get() {
          return {
            _value: this._value,
            _isRawInput: this._isRawInput
          };
        },
        set: function set(state) {
          Object.assign(this, state);
        }
      }]);

      return PatternFixedDefinition;
    }();

    var _excluded$3 = ["chunks"];

    var ChunksTailDetails = /*#__PURE__*/function () {
      /** */
      function ChunksTailDetails() {
        var chunks = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
        var from = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

        _classCallCheck(this, ChunksTailDetails);

        this.chunks = chunks;
        this.from = from;
      }

      _createClass(ChunksTailDetails, [{
        key: "toString",
        value: function toString() {
          return this.chunks.map(String).join('');
        } // $FlowFixMe no ideas

      }, {
        key: "extend",
        value: function extend(tailChunk) {
          if (!String(tailChunk)) return;
          if (isString(tailChunk)) tailChunk = new ContinuousTailDetails(String(tailChunk));
          var lastChunk = this.chunks[this.chunks.length - 1];
          var extendLast = lastChunk && (lastChunk.stop === tailChunk.stop || tailChunk.stop == null) && // if tail chunk goes just after last chunk
          tailChunk.from === lastChunk.from + lastChunk.toString().length;

          if (tailChunk instanceof ContinuousTailDetails) {
            // check the ability to extend previous chunk
            if (extendLast) {
              // extend previous chunk
              lastChunk.extend(tailChunk.toString());
            } else {
              // append new chunk
              this.chunks.push(tailChunk);
            }
          } else if (tailChunk instanceof ChunksTailDetails) {
            if (tailChunk.stop == null) {
              // unwrap floating chunks to parent, keeping `from` pos
              var firstTailChunk;

              while (tailChunk.chunks.length && tailChunk.chunks[0].stop == null) {
                firstTailChunk = tailChunk.chunks.shift();
                firstTailChunk.from += tailChunk.from;
                this.extend(firstTailChunk);
              }
            } // if tail chunk still has value


            if (tailChunk.toString()) {
              // if chunks contains stops, then popup stop to container
              tailChunk.stop = tailChunk.blockIndex;
              this.chunks.push(tailChunk);
            }
          }
        }
      }, {
        key: "appendTo",
        value: function appendTo(masked) {
          // $FlowFixMe
          if (!(masked instanceof IMask.MaskedPattern)) {
            var tail = new ContinuousTailDetails(this.toString());
            return tail.appendTo(masked);
          }

          var details = new ChangeDetails();

          for (var ci = 0; ci < this.chunks.length && !details.skip; ++ci) {
            var chunk = this.chunks[ci];

            var lastBlockIter = masked._mapPosToBlock(masked.value.length);

            var stop = chunk.stop;
            var chunkBlock = void 0;

            if (stop != null && (!lastBlockIter || lastBlockIter.index <= stop)) {
              if (chunk instanceof ChunksTailDetails || // for continuous block also check if stop is exist
              masked._stops.indexOf(stop) >= 0) {
                details.aggregate(masked._appendPlaceholder(stop));
              }

              chunkBlock = chunk instanceof ChunksTailDetails && masked._blocks[stop];
            }

            if (chunkBlock) {
              var tailDetails = chunkBlock.appendTail(chunk);
              tailDetails.skip = false; // always ignore skip, it will be set on last

              details.aggregate(tailDetails);
              masked._value += tailDetails.inserted; // get not inserted chars

              var remainChars = chunk.toString().slice(tailDetails.rawInserted.length);
              if (remainChars) details.aggregate(masked.append(remainChars, {
                tail: true
              }));
            } else {
              details.aggregate(masked.append(chunk.toString(), {
                tail: true
              }));
            }
          }
          return details;
        }
      }, {
        key: "state",
        get: function get() {
          return {
            chunks: this.chunks.map(function (c) {
              return c.state;
            }),
            from: this.from,
            stop: this.stop,
            blockIndex: this.blockIndex
          };
        },
        set: function set(state) {
          var chunks = state.chunks,
              props = _objectWithoutProperties(state, _excluded$3);

          Object.assign(this, props);
          this.chunks = chunks.map(function (cstate) {
            var chunk = "chunks" in cstate ? new ChunksTailDetails() : new ContinuousTailDetails(); // $FlowFixMe already checked above

            chunk.state = cstate;
            return chunk;
          });
        }
      }, {
        key: "shiftBefore",
        value: function shiftBefore(pos) {
          if (this.from >= pos || !this.chunks.length) return '';
          var chunkShiftPos = pos - this.from;
          var ci = 0;

          while (ci < this.chunks.length) {
            var chunk = this.chunks[ci];
            var shiftChar = chunk.shiftBefore(chunkShiftPos);

            if (chunk.toString()) {
              // chunk still contains value
              // but not shifted - means no more available chars to shift
              if (!shiftChar) break;
              ++ci;
            } else {
              // clean if chunk has no value
              this.chunks.splice(ci, 1);
            }

            if (shiftChar) return shiftChar;
          }

          return '';
        }
      }]);

      return ChunksTailDetails;
    }();

    /** Masking by RegExp */

    var MaskedRegExp = /*#__PURE__*/function (_Masked) {
      _inherits(MaskedRegExp, _Masked);

      var _super = _createSuper(MaskedRegExp);

      function MaskedRegExp() {
        _classCallCheck(this, MaskedRegExp);

        return _super.apply(this, arguments);
      }

      _createClass(MaskedRegExp, [{
        key: "_update",
        value:
        /**
          @override
          @param {Object} opts
        */
        function _update(opts) {
          if (opts.mask) opts.validate = function (value) {
            return value.search(opts.mask) >= 0;
          };

          _get(_getPrototypeOf(MaskedRegExp.prototype), "_update", this).call(this, opts);
        }
      }]);

      return MaskedRegExp;
    }(Masked);
    IMask.MaskedRegExp = MaskedRegExp;

    var _excluded$2 = ["_blocks"];

    /**
      Pattern mask
      @param {Object} opts
      @param {Object} opts.blocks
      @param {Object} opts.definitions
      @param {string} opts.placeholderChar
      @param {boolean} opts.lazy
    */
    var MaskedPattern = /*#__PURE__*/function (_Masked) {
      _inherits(MaskedPattern, _Masked);

      var _super = _createSuper(MaskedPattern);

      /** */

      /** */

      /** Single char for empty input */

      /** Show placeholder only when needed */
      function MaskedPattern() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _classCallCheck(this, MaskedPattern);

        // TODO type $Shape<MaskedPatternOptions>={} does not work
        opts.definitions = Object.assign({}, DEFAULT_INPUT_DEFINITIONS, opts.definitions);
        return _super.call(this, Object.assign({}, MaskedPattern.DEFAULTS, opts));
      }
      /**
        @override
        @param {Object} opts
      */


      _createClass(MaskedPattern, [{
        key: "_update",
        value: function _update() {
          var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
          opts.definitions = Object.assign({}, this.definitions, opts.definitions);

          _get(_getPrototypeOf(MaskedPattern.prototype), "_update", this).call(this, opts);

          this._rebuildMask();
        }
        /** */

      }, {
        key: "_rebuildMask",
        value: function _rebuildMask() {
          var _this = this;

          var defs = this.definitions;
          this._blocks = [];
          this._stops = [];
          this._maskedBlocks = {};
          var pattern = this.mask;
          if (!pattern || !defs) return;
          var unmaskingBlock = false;
          var optionalBlock = false;

          for (var i = 0; i < pattern.length; ++i) {
            if (this.blocks) {
              var _ret = function () {
                var p = pattern.slice(i);
                var bNames = Object.keys(_this.blocks).filter(function (bName) {
                  return p.indexOf(bName) === 0;
                }); // order by key length

                bNames.sort(function (a, b) {
                  return b.length - a.length;
                }); // use block name with max length

                var bName = bNames[0];

                if (bName) {
                  // $FlowFixMe no ideas
                  var maskedBlock = createMask(Object.assign({
                    parent: _this,
                    lazy: _this.lazy,
                    placeholderChar: _this.placeholderChar,
                    overwrite: _this.overwrite
                  }, _this.blocks[bName]));

                  if (maskedBlock) {
                    _this._blocks.push(maskedBlock); // store block index


                    if (!_this._maskedBlocks[bName]) _this._maskedBlocks[bName] = [];

                    _this._maskedBlocks[bName].push(_this._blocks.length - 1);
                  }

                  i += bName.length - 1;
                  return "continue";
                }
              }();

              if (_ret === "continue") continue;
            }

            var char = pattern[i];

            var _isInput = (char in defs);

            if (char === MaskedPattern.STOP_CHAR) {
              this._stops.push(this._blocks.length);

              continue;
            }

            if (char === '{' || char === '}') {
              unmaskingBlock = !unmaskingBlock;
              continue;
            }

            if (char === '[' || char === ']') {
              optionalBlock = !optionalBlock;
              continue;
            }

            if (char === MaskedPattern.ESCAPE_CHAR) {
              ++i;
              char = pattern[i];
              if (!char) break;
              _isInput = false;
            }

            var def = _isInput ? new PatternInputDefinition({
              parent: this,
              lazy: this.lazy,
              placeholderChar: this.placeholderChar,
              mask: defs[char],
              isOptional: optionalBlock
            }) : new PatternFixedDefinition({
              char: char,
              isUnmasking: unmaskingBlock
            });

            this._blocks.push(def);
          }
        }
        /**
          @override
        */

      }, {
        key: "state",
        get: function get() {
          return Object.assign({}, _get(_getPrototypeOf(MaskedPattern.prototype), "state", this), {
            _blocks: this._blocks.map(function (b) {
              return b.state;
            })
          });
        },
        set: function set(state) {
          var _blocks = state._blocks,
              maskedState = _objectWithoutProperties(state, _excluded$2);

          this._blocks.forEach(function (b, bi) {
            return b.state = _blocks[bi];
          });

          _set(_getPrototypeOf(MaskedPattern.prototype), "state", maskedState, this, true);
        }
        /**
          @override
        */

      }, {
        key: "reset",
        value: function reset() {
          _get(_getPrototypeOf(MaskedPattern.prototype), "reset", this).call(this);

          this._blocks.forEach(function (b) {
            return b.reset();
          });
        }
        /**
          @override
        */

      }, {
        key: "isComplete",
        get: function get() {
          return this._blocks.every(function (b) {
            return b.isComplete;
          });
        }
        /**
          @override
        */

      }, {
        key: "doCommit",
        value: function doCommit() {
          this._blocks.forEach(function (b) {
            return b.doCommit();
          });

          _get(_getPrototypeOf(MaskedPattern.prototype), "doCommit", this).call(this);
        }
        /**
          @override
        */

      }, {
        key: "unmaskedValue",
        get: function get() {
          return this._blocks.reduce(function (str, b) {
            return str += b.unmaskedValue;
          }, '');
        },
        set: function set(unmaskedValue) {
          _set(_getPrototypeOf(MaskedPattern.prototype), "unmaskedValue", unmaskedValue, this, true);
        }
        /**
          @override
        */

      }, {
        key: "value",
        get: function get() {
          // TODO return _value when not in change?
          return this._blocks.reduce(function (str, b) {
            return str += b.value;
          }, '');
        },
        set: function set(value) {
          _set(_getPrototypeOf(MaskedPattern.prototype), "value", value, this, true);
        }
        /**
          @override
        */

      }, {
        key: "appendTail",
        value: function appendTail(tail) {
          return _get(_getPrototypeOf(MaskedPattern.prototype), "appendTail", this).call(this, tail).aggregate(this._appendPlaceholder());
        }
        /**
          @override
        */

      }, {
        key: "_appendCharRaw",
        value: function _appendCharRaw(ch) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

          var blockIter = this._mapPosToBlock(this.value.length);

          var details = new ChangeDetails();
          if (!blockIter) return details;

          for (var bi = blockIter.index;; ++bi) {
            var _block = this._blocks[bi];
            if (!_block) break;

            var blockDetails = _block._appendChar(ch, flags);

            var skip = blockDetails.skip;
            details.aggregate(blockDetails);
            if (skip || blockDetails.rawInserted) break; // go next char
          }

          return details;
        }
        /**
          @override
        */

      }, {
        key: "extractTail",
        value: function extractTail() {
          var _this2 = this;

          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          var chunkTail = new ChunksTailDetails();
          if (fromPos === toPos) return chunkTail;

          this._forEachBlocksInRange(fromPos, toPos, function (b, bi, bFromPos, bToPos) {
            var blockChunk = b.extractTail(bFromPos, bToPos);
            blockChunk.stop = _this2._findStopBefore(bi);
            blockChunk.from = _this2._blockStartPos(bi);
            if (blockChunk instanceof ChunksTailDetails) blockChunk.blockIndex = bi;
            chunkTail.extend(blockChunk);
          });

          return chunkTail;
        }
        /**
          @override
        */

      }, {
        key: "extractInput",
        value: function extractInput() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          var flags = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
          if (fromPos === toPos) return '';
          var input = '';

          this._forEachBlocksInRange(fromPos, toPos, function (b, _, fromPos, toPos) {
            input += b.extractInput(fromPos, toPos, flags);
          });

          return input;
        }
      }, {
        key: "_findStopBefore",
        value: function _findStopBefore(blockIndex) {
          var stopBefore;

          for (var si = 0; si < this._stops.length; ++si) {
            var stop = this._stops[si];
            if (stop <= blockIndex) stopBefore = stop;else break;
          }

          return stopBefore;
        }
        /** Appends placeholder depending on laziness */

      }, {
        key: "_appendPlaceholder",
        value: function _appendPlaceholder(toBlockIndex) {
          var _this3 = this;

          var details = new ChangeDetails();
          if (this.lazy && toBlockIndex == null) return details;

          var startBlockIter = this._mapPosToBlock(this.value.length);

          if (!startBlockIter) return details;
          var startBlockIndex = startBlockIter.index;
          var endBlockIndex = toBlockIndex != null ? toBlockIndex : this._blocks.length;

          this._blocks.slice(startBlockIndex, endBlockIndex).forEach(function (b) {
            if (!b.lazy || toBlockIndex != null) {
              // $FlowFixMe `_blocks` may not be present
              var args = b._blocks != null ? [b._blocks.length] : [];

              var bDetails = b._appendPlaceholder.apply(b, args);

              _this3._value += bDetails.inserted;
              details.aggregate(bDetails);
            }
          });

          return details;
        }
        /** Finds block in pos */

      }, {
        key: "_mapPosToBlock",
        value: function _mapPosToBlock(pos) {
          var accVal = '';

          for (var bi = 0; bi < this._blocks.length; ++bi) {
            var _block2 = this._blocks[bi];
            var blockStartPos = accVal.length;
            accVal += _block2.value;

            if (pos <= accVal.length) {
              return {
                index: bi,
                offset: pos - blockStartPos
              };
            }
          }
        }
        /** */

      }, {
        key: "_blockStartPos",
        value: function _blockStartPos(blockIndex) {
          return this._blocks.slice(0, blockIndex).reduce(function (pos, b) {
            return pos += b.value.length;
          }, 0);
        }
        /** */

      }, {
        key: "_forEachBlocksInRange",
        value: function _forEachBlocksInRange(fromPos) {
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          var fn = arguments.length > 2 ? arguments[2] : undefined;

          var fromBlockIter = this._mapPosToBlock(fromPos);

          if (fromBlockIter) {
            var toBlockIter = this._mapPosToBlock(toPos); // process first block


            var isSameBlock = toBlockIter && fromBlockIter.index === toBlockIter.index;
            var fromBlockStartPos = fromBlockIter.offset;
            var fromBlockEndPos = toBlockIter && isSameBlock ? toBlockIter.offset : this._blocks[fromBlockIter.index].value.length;
            fn(this._blocks[fromBlockIter.index], fromBlockIter.index, fromBlockStartPos, fromBlockEndPos);

            if (toBlockIter && !isSameBlock) {
              // process intermediate blocks
              for (var bi = fromBlockIter.index + 1; bi < toBlockIter.index; ++bi) {
                fn(this._blocks[bi], bi, 0, this._blocks[bi].value.length);
              } // process last block


              fn(this._blocks[toBlockIter.index], toBlockIter.index, 0, toBlockIter.offset);
            }
          }
        }
        /**
          @override
        */

      }, {
        key: "remove",
        value: function remove() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;

          var removeDetails = _get(_getPrototypeOf(MaskedPattern.prototype), "remove", this).call(this, fromPos, toPos);

          this._forEachBlocksInRange(fromPos, toPos, function (b, _, bFromPos, bToPos) {
            removeDetails.aggregate(b.remove(bFromPos, bToPos));
          });

          return removeDetails;
        }
        /**
          @override
        */

      }, {
        key: "nearestInputPos",
        value: function nearestInputPos(cursorPos) {
          var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : DIRECTION.NONE;
          // TODO refactor - extract alignblock
          var beginBlockData = this._mapPosToBlock(cursorPos) || {
            index: 0,
            offset: 0
          };
          var beginBlockOffset = beginBlockData.offset,
              beginBlockIndex = beginBlockData.index;
          var beginBlock = this._blocks[beginBlockIndex];
          if (!beginBlock) return cursorPos;
          var beginBlockCursorPos = beginBlockOffset; // if position inside block - try to adjust it

          if (beginBlockCursorPos !== 0 && beginBlockCursorPos < beginBlock.value.length) {
            beginBlockCursorPos = beginBlock.nearestInputPos(beginBlockOffset, forceDirection(direction));
          }

          var cursorAtRight = beginBlockCursorPos === beginBlock.value.length;
          var cursorAtLeft = beginBlockCursorPos === 0; //  cursor is INSIDE first block (not at bounds)

          if (!cursorAtLeft && !cursorAtRight) return this._blockStartPos(beginBlockIndex) + beginBlockCursorPos;
          var searchBlockIndex = cursorAtRight ? beginBlockIndex + 1 : beginBlockIndex;

          if (direction === DIRECTION.NONE) {
            // NONE direction used to calculate start input position if no chars were removed
            // FOR NONE:
            // -
            // input|any
            // ->
            //  any|input
            // <-
            //  filled-input|any
            // check if first block at left is input
            if (searchBlockIndex > 0) {
              var blockIndexAtLeft = searchBlockIndex - 1;
              var blockAtLeft = this._blocks[blockIndexAtLeft];
              var blockInputPos = blockAtLeft.nearestInputPos(0, DIRECTION.NONE); // is input

              if (!blockAtLeft.value.length || blockInputPos !== blockAtLeft.value.length) {
                return this._blockStartPos(searchBlockIndex);
              }
            } // ->


            var firstInputAtRight = searchBlockIndex;

            for (var bi = firstInputAtRight; bi < this._blocks.length; ++bi) {
              var blockAtRight = this._blocks[bi];

              var _blockInputPos = blockAtRight.nearestInputPos(0, DIRECTION.NONE);

              if (!blockAtRight.value.length || _blockInputPos !== blockAtRight.value.length) {
                return this._blockStartPos(bi) + _blockInputPos;
              }
            } // <-
            // find first non-fixed symbol


            for (var _bi = searchBlockIndex - 1; _bi >= 0; --_bi) {
              var _block3 = this._blocks[_bi];

              var _blockInputPos2 = _block3.nearestInputPos(0, DIRECTION.NONE); // is input


              if (!_block3.value.length || _blockInputPos2 !== _block3.value.length) {
                return this._blockStartPos(_bi) + _block3.value.length;
              }
            }

            return cursorPos;
          }

          if (direction === DIRECTION.LEFT || direction === DIRECTION.FORCE_LEFT) {
            // -
            //  any|filled-input
            // <-
            //  any|first not empty is not-len-aligned
            //  not-0-aligned|any
            // ->
            //  any|not-len-aligned or end
            // check if first block at right is filled input
            var firstFilledBlockIndexAtRight;

            for (var _bi2 = searchBlockIndex; _bi2 < this._blocks.length; ++_bi2) {
              if (this._blocks[_bi2].value) {
                firstFilledBlockIndexAtRight = _bi2;
                break;
              }
            }

            if (firstFilledBlockIndexAtRight != null) {
              var filledBlock = this._blocks[firstFilledBlockIndexAtRight];

              var _blockInputPos3 = filledBlock.nearestInputPos(0, DIRECTION.RIGHT);

              if (_blockInputPos3 === 0 && filledBlock.unmaskedValue.length) {
                // filled block is input
                return this._blockStartPos(firstFilledBlockIndexAtRight) + _blockInputPos3;
              }
            } // <-
            // find this vars


            var firstFilledInputBlockIndex = -1;
            var firstEmptyInputBlockIndex; // TODO consider nested empty inputs

            for (var _bi3 = searchBlockIndex - 1; _bi3 >= 0; --_bi3) {
              var _block4 = this._blocks[_bi3];

              var _blockInputPos4 = _block4.nearestInputPos(_block4.value.length, DIRECTION.FORCE_LEFT);

              if (!_block4.value || _blockInputPos4 !== 0) firstEmptyInputBlockIndex = _bi3;

              if (_blockInputPos4 !== 0) {
                if (_blockInputPos4 !== _block4.value.length) {
                  // aligned inside block - return immediately
                  return this._blockStartPos(_bi3) + _blockInputPos4;
                } else {
                  // found filled
                  firstFilledInputBlockIndex = _bi3;
                  break;
                }
              }
            }

            if (direction === DIRECTION.LEFT) {
              // try find first empty input before start searching position only when not forced
              for (var _bi4 = firstFilledInputBlockIndex + 1; _bi4 <= Math.min(searchBlockIndex, this._blocks.length - 1); ++_bi4) {
                var _block5 = this._blocks[_bi4];

                var _blockInputPos5 = _block5.nearestInputPos(0, DIRECTION.NONE);

                var blockAlignedPos = this._blockStartPos(_bi4) + _blockInputPos5;

                if (blockAlignedPos > cursorPos) break; // if block is not lazy input

                if (_blockInputPos5 !== _block5.value.length) return blockAlignedPos;
              }
            } // process overflow


            if (firstFilledInputBlockIndex >= 0) {
              return this._blockStartPos(firstFilledInputBlockIndex) + this._blocks[firstFilledInputBlockIndex].value.length;
            } // for lazy if has aligned left inside fixed and has came to the start - use start position


            if (direction === DIRECTION.FORCE_LEFT || this.lazy && !this.extractInput() && !isInput(this._blocks[searchBlockIndex])) {
              return 0;
            }

            if (firstEmptyInputBlockIndex != null) {
              return this._blockStartPos(firstEmptyInputBlockIndex);
            } // find first input


            for (var _bi5 = searchBlockIndex; _bi5 < this._blocks.length; ++_bi5) {
              var _block6 = this._blocks[_bi5];

              var _blockInputPos6 = _block6.nearestInputPos(0, DIRECTION.NONE); // is input


              if (!_block6.value.length || _blockInputPos6 !== _block6.value.length) {
                return this._blockStartPos(_bi5) + _blockInputPos6;
              }
            }

            return 0;
          }

          if (direction === DIRECTION.RIGHT || direction === DIRECTION.FORCE_RIGHT) {
            // ->
            //  any|not-len-aligned and filled
            //  any|not-len-aligned
            // <-
            //  not-0-aligned or start|any
            var firstInputBlockAlignedIndex;
            var firstInputBlockAlignedPos;

            for (var _bi6 = searchBlockIndex; _bi6 < this._blocks.length; ++_bi6) {
              var _block7 = this._blocks[_bi6];

              var _blockInputPos7 = _block7.nearestInputPos(0, DIRECTION.NONE);

              if (_blockInputPos7 !== _block7.value.length) {
                firstInputBlockAlignedPos = this._blockStartPos(_bi6) + _blockInputPos7;
                firstInputBlockAlignedIndex = _bi6;
                break;
              }
            }

            if (firstInputBlockAlignedIndex != null && firstInputBlockAlignedPos != null) {
              for (var _bi7 = firstInputBlockAlignedIndex; _bi7 < this._blocks.length; ++_bi7) {
                var _block8 = this._blocks[_bi7];

                var _blockInputPos8 = _block8.nearestInputPos(0, DIRECTION.FORCE_RIGHT);

                if (_blockInputPos8 !== _block8.value.length) {
                  return this._blockStartPos(_bi7) + _blockInputPos8;
                }
              }

              return direction === DIRECTION.FORCE_RIGHT ? this.value.length : firstInputBlockAlignedPos;
            }

            for (var _bi8 = Math.min(searchBlockIndex, this._blocks.length - 1); _bi8 >= 0; --_bi8) {
              var _block9 = this._blocks[_bi8];

              var _blockInputPos9 = _block9.nearestInputPos(_block9.value.length, DIRECTION.LEFT);

              if (_blockInputPos9 !== 0) {
                var alignedPos = this._blockStartPos(_bi8) + _blockInputPos9;

                if (alignedPos >= cursorPos) return alignedPos;
                break;
              }
            }
          }

          return cursorPos;
        }
        /** Get block by name */

      }, {
        key: "maskedBlock",
        value: function maskedBlock(name) {
          return this.maskedBlocks(name)[0];
        }
        /** Get all blocks by name */

      }, {
        key: "maskedBlocks",
        value: function maskedBlocks(name) {
          var _this4 = this;

          var indices = this._maskedBlocks[name];
          if (!indices) return [];
          return indices.map(function (gi) {
            return _this4._blocks[gi];
          });
        }
      }]);

      return MaskedPattern;
    }(Masked);
    MaskedPattern.DEFAULTS = {
      lazy: true,
      placeholderChar: '_'
    };
    MaskedPattern.STOP_CHAR = '`';
    MaskedPattern.ESCAPE_CHAR = '\\';
    MaskedPattern.InputDefinition = PatternInputDefinition;
    MaskedPattern.FixedDefinition = PatternFixedDefinition;

    function isInput(block) {
      if (!block) return false;
      var value = block.value;
      return !value || block.nearestInputPos(0, DIRECTION.NONE) !== value.length;
    }

    IMask.MaskedPattern = MaskedPattern;

    /** Pattern which accepts ranges */

    var MaskedRange = /*#__PURE__*/function (_MaskedPattern) {
      _inherits(MaskedRange, _MaskedPattern);

      var _super = _createSuper(MaskedRange);

      function MaskedRange() {
        _classCallCheck(this, MaskedRange);

        return _super.apply(this, arguments);
      }

      _createClass(MaskedRange, [{
        key: "_matchFrom",
        get:
        /**
          Optionally sets max length of pattern.
          Used when pattern length is longer then `to` param length. Pads zeros at start in this case.
        */

        /** Min bound */

        /** Max bound */

        /** */
        function get() {
          return this.maxLength - String(this.from).length;
        }
        /**
          @override
        */

      }, {
        key: "_update",
        value: function _update(opts) {
          // TODO type
          opts = Object.assign({
            to: this.to || 0,
            from: this.from || 0
          }, opts);
          var maxLength = String(opts.to).length;
          if (opts.maxLength != null) maxLength = Math.max(maxLength, opts.maxLength);
          opts.maxLength = maxLength;
          var fromStr = String(opts.from).padStart(maxLength, '0');
          var toStr = String(opts.to).padStart(maxLength, '0');
          var sameCharsCount = 0;

          while (sameCharsCount < toStr.length && toStr[sameCharsCount] === fromStr[sameCharsCount]) {
            ++sameCharsCount;
          }

          opts.mask = toStr.slice(0, sameCharsCount).replace(/0/g, '\\0') + '0'.repeat(maxLength - sameCharsCount);

          _get(_getPrototypeOf(MaskedRange.prototype), "_update", this).call(this, opts);
        }
        /**
          @override
        */

      }, {
        key: "isComplete",
        get: function get() {
          return _get(_getPrototypeOf(MaskedRange.prototype), "isComplete", this) && Boolean(this.value);
        }
      }, {
        key: "boundaries",
        value: function boundaries(str) {
          var minstr = '';
          var maxstr = '';

          var _ref = str.match(/^(\D*)(\d*)(\D*)/) || [],
              _ref2 = _slicedToArray(_ref, 3),
              placeholder = _ref2[1],
              num = _ref2[2];

          if (num) {
            minstr = '0'.repeat(placeholder.length) + num;
            maxstr = '9'.repeat(placeholder.length) + num;
          }

          minstr = minstr.padEnd(this.maxLength, '0');
          maxstr = maxstr.padEnd(this.maxLength, '9');
          return [minstr, maxstr];
        }
        /**
          @override
        */

      }, {
        key: "doPrepare",
        value: function doPrepare(str) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          str = _get(_getPrototypeOf(MaskedRange.prototype), "doPrepare", this).call(this, str, flags).replace(/\D/g, '');
          if (!this.autofix) return str;
          var fromStr = String(this.from).padStart(this.maxLength, '0');
          var toStr = String(this.to).padStart(this.maxLength, '0');
          var val = this.value;
          var prepStr = '';

          for (var ci = 0; ci < str.length; ++ci) {
            var nextVal = val + prepStr + str[ci];

            var _this$boundaries = this.boundaries(nextVal),
                _this$boundaries2 = _slicedToArray(_this$boundaries, 2),
                minstr = _this$boundaries2[0],
                maxstr = _this$boundaries2[1];

            if (Number(maxstr) < this.from) prepStr += fromStr[nextVal.length - 1];else if (Number(minstr) > this.to) prepStr += toStr[nextVal.length - 1];else prepStr += str[ci];
          }

          return prepStr;
        }
        /**
          @override
        */

      }, {
        key: "doValidate",
        value: function doValidate() {
          var _get2;

          var str = this.value;
          var firstNonZero = str.search(/[^0]/);
          if (firstNonZero === -1 && str.length <= this._matchFrom) return true;

          var _this$boundaries3 = this.boundaries(str),
              _this$boundaries4 = _slicedToArray(_this$boundaries3, 2),
              minstr = _this$boundaries4[0],
              maxstr = _this$boundaries4[1];

          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return this.from <= Number(maxstr) && Number(minstr) <= this.to && (_get2 = _get(_getPrototypeOf(MaskedRange.prototype), "doValidate", this)).call.apply(_get2, [this].concat(args));
        }
      }]);

      return MaskedRange;
    }(MaskedPattern);
    IMask.MaskedRange = MaskedRange;

    /** Date mask */

    var MaskedDate = /*#__PURE__*/function (_MaskedPattern) {
      _inherits(MaskedDate, _MaskedPattern);

      var _super = _createSuper(MaskedDate);

      /** Pattern mask for date according to {@link MaskedDate#format} */

      /** Start date */

      /** End date */

      /** */

      /**
        @param {Object} opts
      */
      function MaskedDate(opts) {
        _classCallCheck(this, MaskedDate);

        return _super.call(this, Object.assign({}, MaskedDate.DEFAULTS, opts));
      }
      /**
        @override
      */


      _createClass(MaskedDate, [{
        key: "_update",
        value: function _update(opts) {
          if (opts.mask === Date) delete opts.mask;
          if (opts.pattern) opts.mask = opts.pattern;
          var blocks = opts.blocks;
          opts.blocks = Object.assign({}, MaskedDate.GET_DEFAULT_BLOCKS()); // adjust year block

          if (opts.min) opts.blocks.Y.from = opts.min.getFullYear();
          if (opts.max) opts.blocks.Y.to = opts.max.getFullYear();

          if (opts.min && opts.max && opts.blocks.Y.from === opts.blocks.Y.to) {
            opts.blocks.m.from = opts.min.getMonth() + 1;
            opts.blocks.m.to = opts.max.getMonth() + 1;

            if (opts.blocks.m.from === opts.blocks.m.to) {
              opts.blocks.d.from = opts.min.getDate();
              opts.blocks.d.to = opts.max.getDate();
            }
          }

          Object.assign(opts.blocks, blocks); // add autofix

          Object.keys(opts.blocks).forEach(function (bk) {
            var b = opts.blocks[bk];
            if (!('autofix' in b)) b.autofix = opts.autofix;
          });

          _get(_getPrototypeOf(MaskedDate.prototype), "_update", this).call(this, opts);
        }
        /**
          @override
        */

      }, {
        key: "doValidate",
        value: function doValidate() {
          var _get2;

          var date = this.date;

          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return (_get2 = _get(_getPrototypeOf(MaskedDate.prototype), "doValidate", this)).call.apply(_get2, [this].concat(args)) && (!this.isComplete || this.isDateExist(this.value) && date != null && (this.min == null || this.min <= date) && (this.max == null || date <= this.max));
        }
        /** Checks if date is exists */

      }, {
        key: "isDateExist",
        value: function isDateExist(str) {
          return this.format(this.parse(str, this), this).indexOf(str) >= 0;
        }
        /** Parsed Date */

      }, {
        key: "date",
        get: function get() {
          return this.typedValue;
        },
        set: function set(date) {
          this.typedValue = date;
        }
        /**
          @override
        */

      }, {
        key: "typedValue",
        get: function get() {
          return this.isComplete ? _get(_getPrototypeOf(MaskedDate.prototype), "typedValue", this) : null;
        },
        set: function set(value) {
          _set(_getPrototypeOf(MaskedDate.prototype), "typedValue", value, this, true);
        }
      }]);

      return MaskedDate;
    }(MaskedPattern);
    MaskedDate.DEFAULTS = {
      pattern: 'd{.}`m{.}`Y',
      format: function format(date) {
        var day = String(date.getDate()).padStart(2, '0');
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var year = date.getFullYear();
        return [day, month, year].join('.');
      },
      parse: function parse(str) {
        var _str$split = str.split('.'),
            _str$split2 = _slicedToArray(_str$split, 3),
            day = _str$split2[0],
            month = _str$split2[1],
            year = _str$split2[2];

        return new Date(year, month - 1, day);
      }
    };

    MaskedDate.GET_DEFAULT_BLOCKS = function () {
      return {
        d: {
          mask: MaskedRange,
          from: 1,
          to: 31,
          maxLength: 2
        },
        m: {
          mask: MaskedRange,
          from: 1,
          to: 12,
          maxLength: 2
        },
        Y: {
          mask: MaskedRange,
          from: 1900,
          to: 9999
        }
      };
    };

    IMask.MaskedDate = MaskedDate;

    /**
      Generic element API to use with mask
      @interface
    */
    var MaskElement = /*#__PURE__*/function () {
      function MaskElement() {
        _classCallCheck(this, MaskElement);
      }

      _createClass(MaskElement, [{
        key: "selectionStart",
        get:
        /** */

        /** */

        /** */

        /** Safely returns selection start */
        function get() {
          var start;

          try {
            start = this._unsafeSelectionStart;
          } catch (e) {}

          return start != null ? start : this.value.length;
        }
        /** Safely returns selection end */

      }, {
        key: "selectionEnd",
        get: function get() {
          var end;

          try {
            end = this._unsafeSelectionEnd;
          } catch (e) {}

          return end != null ? end : this.value.length;
        }
        /** Safely sets element selection */

      }, {
        key: "select",
        value: function select(start, end) {
          if (start == null || end == null || start === this.selectionStart && end === this.selectionEnd) return;

          try {
            this._unsafeSelect(start, end);
          } catch (e) {}
        }
        /** Should be overriden in subclasses */

      }, {
        key: "_unsafeSelect",
        value: function _unsafeSelect(start, end) {}
        /** Should be overriden in subclasses */

      }, {
        key: "isActive",
        get: function get() {
          return false;
        }
        /** Should be overriden in subclasses */

      }, {
        key: "bindEvents",
        value: function bindEvents(handlers) {}
        /** Should be overriden in subclasses */

      }, {
        key: "unbindEvents",
        value: function unbindEvents() {}
      }]);

      return MaskElement;
    }();
    IMask.MaskElement = MaskElement;

    /** Bridge between HTMLElement and {@link Masked} */

    var HTMLMaskElement = /*#__PURE__*/function (_MaskElement) {
      _inherits(HTMLMaskElement, _MaskElement);

      var _super = _createSuper(HTMLMaskElement);

      /** Mapping between HTMLElement events and mask internal events */

      /** HTMLElement to use mask on */

      /**
        @param {HTMLInputElement|HTMLTextAreaElement} input
      */
      function HTMLMaskElement(input) {
        var _this;

        _classCallCheck(this, HTMLMaskElement);

        _this = _super.call(this);
        _this.input = input;
        _this._handlers = {};
        return _this;
      }
      /** */
      // $FlowFixMe https://github.com/facebook/flow/issues/2839


      _createClass(HTMLMaskElement, [{
        key: "rootElement",
        get: function get() {
          return this.input.getRootNode ? this.input.getRootNode() : document;
        }
        /**
          Is element in focus
          @readonly
        */

      }, {
        key: "isActive",
        get: function get() {
          //$FlowFixMe
          return this.input === this.rootElement.activeElement;
        }
        /**
          Returns HTMLElement selection start
          @override
        */

      }, {
        key: "_unsafeSelectionStart",
        get: function get() {
          return this.input.selectionStart;
        }
        /**
          Returns HTMLElement selection end
          @override
        */

      }, {
        key: "_unsafeSelectionEnd",
        get: function get() {
          return this.input.selectionEnd;
        }
        /**
          Sets HTMLElement selection
          @override
        */

      }, {
        key: "_unsafeSelect",
        value: function _unsafeSelect(start, end) {
          this.input.setSelectionRange(start, end);
        }
        /**
          HTMLElement value
          @override
        */

      }, {
        key: "value",
        get: function get() {
          return this.input.value;
        },
        set: function set(value) {
          this.input.value = value;
        }
        /**
          Binds HTMLElement events to mask internal events
          @override
        */

      }, {
        key: "bindEvents",
        value: function bindEvents(handlers) {
          var _this2 = this;

          Object.keys(handlers).forEach(function (event) {
            return _this2._toggleEventHandler(HTMLMaskElement.EVENTS_MAP[event], handlers[event]);
          });
        }
        /**
          Unbinds HTMLElement events to mask internal events
          @override
        */

      }, {
        key: "unbindEvents",
        value: function unbindEvents() {
          var _this3 = this;

          Object.keys(this._handlers).forEach(function (event) {
            return _this3._toggleEventHandler(event);
          });
        }
        /** */

      }, {
        key: "_toggleEventHandler",
        value: function _toggleEventHandler(event, handler) {
          if (this._handlers[event]) {
            this.input.removeEventListener(event, this._handlers[event]);
            delete this._handlers[event];
          }

          if (handler) {
            this.input.addEventListener(event, handler);
            this._handlers[event] = handler;
          }
        }
      }]);

      return HTMLMaskElement;
    }(MaskElement);
    HTMLMaskElement.EVENTS_MAP = {
      selectionChange: 'keydown',
      input: 'input',
      drop: 'drop',
      click: 'click',
      focus: 'focus',
      commit: 'blur'
    };
    IMask.HTMLMaskElement = HTMLMaskElement;

    var HTMLContenteditableMaskElement = /*#__PURE__*/function (_HTMLMaskElement) {
      _inherits(HTMLContenteditableMaskElement, _HTMLMaskElement);

      var _super = _createSuper(HTMLContenteditableMaskElement);

      function HTMLContenteditableMaskElement() {
        _classCallCheck(this, HTMLContenteditableMaskElement);

        return _super.apply(this, arguments);
      }

      _createClass(HTMLContenteditableMaskElement, [{
        key: "_unsafeSelectionStart",
        get:
        /**
          Returns HTMLElement selection start
          @override
        */
        function get() {
          var root = this.rootElement;
          var selection = root.getSelection && root.getSelection();
          return selection && selection.anchorOffset;
        }
        /**
          Returns HTMLElement selection end
          @override
        */

      }, {
        key: "_unsafeSelectionEnd",
        get: function get() {
          var root = this.rootElement;
          var selection = root.getSelection && root.getSelection();
          return selection && this._unsafeSelectionStart + String(selection).length;
        }
        /**
          Sets HTMLElement selection
          @override
        */

      }, {
        key: "_unsafeSelect",
        value: function _unsafeSelect(start, end) {
          if (!this.rootElement.createRange) return;
          var range = this.rootElement.createRange();
          range.setStart(this.input.firstChild || this.input, start);
          range.setEnd(this.input.lastChild || this.input, end);
          var root = this.rootElement;
          var selection = root.getSelection && root.getSelection();

          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        /**
          HTMLElement value
          @override
        */

      }, {
        key: "value",
        get: function get() {
          // $FlowFixMe
          return this.input.textContent;
        },
        set: function set(value) {
          this.input.textContent = value;
        }
      }]);

      return HTMLContenteditableMaskElement;
    }(HTMLMaskElement);
    IMask.HTMLContenteditableMaskElement = HTMLContenteditableMaskElement;

    var _excluded$1 = ["mask"];
    /** Listens to element events and controls changes between element and {@link Masked} */

    var InputMask = /*#__PURE__*/function () {
      /**
        View element
        @readonly
      */

      /**
        Internal {@link Masked} model
        @readonly
      */

      /**
        @param {MaskElement|HTMLInputElement|HTMLTextAreaElement} el
        @param {Object} opts
      */
      function InputMask(el, opts) {
        _classCallCheck(this, InputMask);

        this.el = el instanceof MaskElement ? el : el.isContentEditable && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA' ? new HTMLContenteditableMaskElement(el) : new HTMLMaskElement(el);
        this.masked = createMask(opts);
        this._listeners = {};
        this._value = '';
        this._unmaskedValue = '';
        this._saveSelection = this._saveSelection.bind(this);
        this._onInput = this._onInput.bind(this);
        this._onChange = this._onChange.bind(this);
        this._onDrop = this._onDrop.bind(this);
        this._onFocus = this._onFocus.bind(this);
        this._onClick = this._onClick.bind(this);
        this.alignCursor = this.alignCursor.bind(this);
        this.alignCursorFriendly = this.alignCursorFriendly.bind(this);

        this._bindEvents(); // refresh


        this.updateValue();

        this._onChange();
      }
      /** Read or update mask */


      _createClass(InputMask, [{
        key: "mask",
        get: function get() {
          return this.masked.mask;
        },
        set: function set(mask) {
          if (this.maskEquals(mask)) return;

          if (!(mask instanceof IMask.Masked) && this.masked.constructor === maskedClass(mask)) {
            this.masked.updateOptions({
              mask: mask
            });
            return;
          }

          var masked = createMask({
            mask: mask
          });
          masked.unmaskedValue = this.masked.unmaskedValue;
          this.masked = masked;
        }
        /** Raw value */

      }, {
        key: "maskEquals",
        value: function maskEquals(mask) {
          return mask == null || mask === this.masked.mask || mask === Date && this.masked instanceof MaskedDate;
        }
      }, {
        key: "value",
        get: function get() {
          return this._value;
        },
        set: function set(str) {
          this.masked.value = str;
          this.updateControl();
          this.alignCursor();
        }
        /** Unmasked value */

      }, {
        key: "unmaskedValue",
        get: function get() {
          return this._unmaskedValue;
        },
        set: function set(str) {
          this.masked.unmaskedValue = str;
          this.updateControl();
          this.alignCursor();
        }
        /** Typed unmasked value */

      }, {
        key: "typedValue",
        get: function get() {
          return this.masked.typedValue;
        },
        set: function set(val) {
          this.masked.typedValue = val;
          this.updateControl();
          this.alignCursor();
        }
        /**
          Starts listening to element events
          @protected
        */

      }, {
        key: "_bindEvents",
        value: function _bindEvents() {
          this.el.bindEvents({
            selectionChange: this._saveSelection,
            input: this._onInput,
            drop: this._onDrop,
            click: this._onClick,
            focus: this._onFocus,
            commit: this._onChange
          });
        }
        /**
          Stops listening to element events
          @protected
         */

      }, {
        key: "_unbindEvents",
        value: function _unbindEvents() {
          if (this.el) this.el.unbindEvents();
        }
        /**
          Fires custom event
          @protected
         */

      }, {
        key: "_fireEvent",
        value: function _fireEvent(ev) {
          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          var listeners = this._listeners[ev];
          if (!listeners) return;
          listeners.forEach(function (l) {
            return l.apply(void 0, args);
          });
        }
        /**
          Current selection start
          @readonly
        */

      }, {
        key: "selectionStart",
        get: function get() {
          return this._cursorChanging ? this._changingCursorPos : this.el.selectionStart;
        }
        /** Current cursor position */

      }, {
        key: "cursorPos",
        get: function get() {
          return this._cursorChanging ? this._changingCursorPos : this.el.selectionEnd;
        },
        set: function set(pos) {
          if (!this.el || !this.el.isActive) return;
          this.el.select(pos, pos);

          this._saveSelection();
        }
        /**
          Stores current selection
          @protected
        */

      }, {
        key: "_saveSelection",
        value: function _saveSelection() {
          if (this.value !== this.el.value) {
            console.warn('Element value was changed outside of mask. Syncronize mask using `mask.updateValue()` to work properly.'); // eslint-disable-line no-console
          }

          this._selection = {
            start: this.selectionStart,
            end: this.cursorPos
          };
        }
        /** Syncronizes model value from view */

      }, {
        key: "updateValue",
        value: function updateValue() {
          this.masked.value = this.el.value;
          this._value = this.masked.value;
        }
        /** Syncronizes view from model value, fires change events */

      }, {
        key: "updateControl",
        value: function updateControl() {
          var newUnmaskedValue = this.masked.unmaskedValue;
          var newValue = this.masked.value;
          var isChanged = this.unmaskedValue !== newUnmaskedValue || this.value !== newValue;
          this._unmaskedValue = newUnmaskedValue;
          this._value = newValue;
          if (this.el.value !== newValue) this.el.value = newValue;
          if (isChanged) this._fireChangeEvents();
        }
        /** Updates options with deep equal check, recreates @{link Masked} model if mask type changes */

      }, {
        key: "updateOptions",
        value: function updateOptions(opts) {
          var mask = opts.mask,
              restOpts = _objectWithoutProperties(opts, _excluded$1);

          var updateMask = !this.maskEquals(mask);
          var updateOpts = !objectIncludes(this.masked, restOpts);
          if (updateMask) this.mask = mask;
          if (updateOpts) this.masked.updateOptions(restOpts);
          if (updateMask || updateOpts) this.updateControl();
        }
        /** Updates cursor */

      }, {
        key: "updateCursor",
        value: function updateCursor(cursorPos) {
          if (cursorPos == null) return;
          this.cursorPos = cursorPos; // also queue change cursor for mobile browsers

          this._delayUpdateCursor(cursorPos);
        }
        /**
          Delays cursor update to support mobile browsers
          @private
        */

      }, {
        key: "_delayUpdateCursor",
        value: function _delayUpdateCursor(cursorPos) {
          var _this = this;

          this._abortUpdateCursor();

          this._changingCursorPos = cursorPos;
          this._cursorChanging = setTimeout(function () {
            if (!_this.el) return; // if was destroyed

            _this.cursorPos = _this._changingCursorPos;

            _this._abortUpdateCursor();
          }, 10);
        }
        /**
          Fires custom events
          @protected
        */

      }, {
        key: "_fireChangeEvents",
        value: function _fireChangeEvents() {
          this._fireEvent('accept', this._inputEvent);

          if (this.masked.isComplete) this._fireEvent('complete', this._inputEvent);
        }
        /**
          Aborts delayed cursor update
          @private
        */

      }, {
        key: "_abortUpdateCursor",
        value: function _abortUpdateCursor() {
          if (this._cursorChanging) {
            clearTimeout(this._cursorChanging);
            delete this._cursorChanging;
          }
        }
        /** Aligns cursor to nearest available position */

      }, {
        key: "alignCursor",
        value: function alignCursor() {
          this.cursorPos = this.masked.nearestInputPos(this.cursorPos, DIRECTION.LEFT);
        }
        /** Aligns cursor only if selection is empty */

      }, {
        key: "alignCursorFriendly",
        value: function alignCursorFriendly() {
          if (this.selectionStart !== this.cursorPos) return; // skip if range is selected

          this.alignCursor();
        }
        /** Adds listener on custom event */

      }, {
        key: "on",
        value: function on(ev, handler) {
          if (!this._listeners[ev]) this._listeners[ev] = [];

          this._listeners[ev].push(handler);

          return this;
        }
        /** Removes custom event listener */

      }, {
        key: "off",
        value: function off(ev, handler) {
          if (!this._listeners[ev]) return this;

          if (!handler) {
            delete this._listeners[ev];
            return this;
          }

          var hIndex = this._listeners[ev].indexOf(handler);

          if (hIndex >= 0) this._listeners[ev].splice(hIndex, 1);
          return this;
        }
        /** Handles view input event */

      }, {
        key: "_onInput",
        value: function _onInput(e) {
          this._inputEvent = e;

          this._abortUpdateCursor(); // fix strange IE behavior


          if (!this._selection) return this.updateValue();
          var details = new ActionDetails( // new state
          this.el.value, this.cursorPos, // old state
          this.value, this._selection);
          var oldRawValue = this.masked.rawInputValue;
          var offset = this.masked.splice(details.startChangePos, details.removed.length, details.inserted, details.removeDirection).offset; // force align in remove direction only if no input chars were removed
          // otherwise we still need to align with NONE (to get out from fixed symbols for instance)

          var removeDirection = oldRawValue === this.masked.rawInputValue ? details.removeDirection : DIRECTION.NONE;
          var cursorPos = this.masked.nearestInputPos(details.startChangePos + offset, removeDirection);
          this.updateControl();
          this.updateCursor(cursorPos);
          delete this._inputEvent;
        }
        /** Handles view change event and commits model value */

      }, {
        key: "_onChange",
        value: function _onChange() {
          if (this.value !== this.el.value) {
            this.updateValue();
          }

          this.masked.doCommit();
          this.updateControl();

          this._saveSelection();
        }
        /** Handles view drop event, prevents by default */

      }, {
        key: "_onDrop",
        value: function _onDrop(ev) {
          ev.preventDefault();
          ev.stopPropagation();
        }
        /** Restore last selection on focus */

      }, {
        key: "_onFocus",
        value: function _onFocus(ev) {
          this.alignCursorFriendly();
        }
        /** Restore last selection on focus */

      }, {
        key: "_onClick",
        value: function _onClick(ev) {
          this.alignCursorFriendly();
        }
        /** Unbind view events and removes element reference */

      }, {
        key: "destroy",
        value: function destroy() {
          this._unbindEvents(); // $FlowFixMe why not do so?


          this._listeners.length = 0; // $FlowFixMe

          delete this.el;
        }
      }]);

      return InputMask;
    }();
    IMask.InputMask = InputMask;

    /** Pattern which validates enum values */

    var MaskedEnum = /*#__PURE__*/function (_MaskedPattern) {
      _inherits(MaskedEnum, _MaskedPattern);

      var _super = _createSuper(MaskedEnum);

      function MaskedEnum() {
        _classCallCheck(this, MaskedEnum);

        return _super.apply(this, arguments);
      }

      _createClass(MaskedEnum, [{
        key: "_update",
        value:
        /**
          @override
          @param {Object} opts
        */
        function _update(opts) {
          // TODO type
          if (opts.enum) opts.mask = '*'.repeat(opts.enum[0].length);

          _get(_getPrototypeOf(MaskedEnum.prototype), "_update", this).call(this, opts);
        }
        /**
          @override
        */

      }, {
        key: "doValidate",
        value: function doValidate() {
          var _this = this,
              _get2;

          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return this.enum.some(function (e) {
            return e.indexOf(_this.unmaskedValue) >= 0;
          }) && (_get2 = _get(_getPrototypeOf(MaskedEnum.prototype), "doValidate", this)).call.apply(_get2, [this].concat(args));
        }
      }]);

      return MaskedEnum;
    }(MaskedPattern);
    IMask.MaskedEnum = MaskedEnum;

    /**
      Number mask
      @param {Object} opts
      @param {string} opts.radix - Single char
      @param {string} opts.thousandsSeparator - Single char
      @param {Array<string>} opts.mapToRadix - Array of single chars
      @param {number} opts.min
      @param {number} opts.max
      @param {number} opts.scale - Digits after point
      @param {boolean} opts.signed - Allow negative
      @param {boolean} opts.normalizeZeros - Flag to remove leading and trailing zeros in the end of editing
      @param {boolean} opts.padFractionalZeros - Flag to pad trailing zeros after point in the end of editing
    */
    var MaskedNumber = /*#__PURE__*/function (_Masked) {
      _inherits(MaskedNumber, _Masked);

      var _super = _createSuper(MaskedNumber);

      /** Single char */

      /** Single char */

      /** Array of single chars */

      /** */

      /** */

      /** Digits after point */

      /** */

      /** Flag to remove leading and trailing zeros in the end of editing */

      /** Flag to pad trailing zeros after point in the end of editing */
      function MaskedNumber(opts) {
        _classCallCheck(this, MaskedNumber);

        return _super.call(this, Object.assign({}, MaskedNumber.DEFAULTS, opts));
      }
      /**
        @override
      */


      _createClass(MaskedNumber, [{
        key: "_update",
        value: function _update(opts) {
          _get(_getPrototypeOf(MaskedNumber.prototype), "_update", this).call(this, opts);

          this._updateRegExps();
        }
        /** */

      }, {
        key: "_updateRegExps",
        value: function _updateRegExps() {
          // use different regexp to process user input (more strict, input suffix) and tail shifting
          var start = '^' + (this.allowNegative ? '[+|\\-]?' : '');
          var midInput = '(0|([1-9]+\\d*))?';
          var mid = '\\d*';
          var end = (this.scale ? '(' + escapeRegExp(this.radix) + '\\d{0,' + this.scale + '})?' : '') + '$';
          this._numberRegExpInput = new RegExp(start + midInput + end);
          this._numberRegExp = new RegExp(start + mid + end);
          this._mapToRadixRegExp = new RegExp('[' + this.mapToRadix.map(escapeRegExp).join('') + ']', 'g');
          this._thousandsSeparatorRegExp = new RegExp(escapeRegExp(this.thousandsSeparator), 'g');
        }
        /** */

      }, {
        key: "_removeThousandsSeparators",
        value: function _removeThousandsSeparators(value) {
          return value.replace(this._thousandsSeparatorRegExp, '');
        }
        /** */

      }, {
        key: "_insertThousandsSeparators",
        value: function _insertThousandsSeparators(value) {
          // https://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
          var parts = value.split(this.radix);
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandsSeparator);
          return parts.join(this.radix);
        }
        /**
          @override
        */

      }, {
        key: "doPrepare",
        value: function doPrepare(str) {
          var _get2;

          for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
          }

          return (_get2 = _get(_getPrototypeOf(MaskedNumber.prototype), "doPrepare", this)).call.apply(_get2, [this, this._removeThousandsSeparators(str.replace(this._mapToRadixRegExp, this.radix))].concat(args));
        }
        /** */

      }, {
        key: "_separatorsCount",
        value: function _separatorsCount(to) {
          var extendOnSeparators = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
          var count = 0;

          for (var pos = 0; pos < to; ++pos) {
            if (this._value.indexOf(this.thousandsSeparator, pos) === pos) {
              ++count;
              if (extendOnSeparators) to += this.thousandsSeparator.length;
            }
          }

          return count;
        }
        /** */

      }, {
        key: "_separatorsCountFromSlice",
        value: function _separatorsCountFromSlice() {
          var slice = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._value;
          return this._separatorsCount(this._removeThousandsSeparators(slice).length, true);
        }
        /**
          @override
        */

      }, {
        key: "extractInput",
        value: function extractInput() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;
          var flags = arguments.length > 2 ? arguments[2] : undefined;

          var _this$_adjustRangeWit = this._adjustRangeWithSeparators(fromPos, toPos);

          var _this$_adjustRangeWit2 = _slicedToArray(_this$_adjustRangeWit, 2);

          fromPos = _this$_adjustRangeWit2[0];
          toPos = _this$_adjustRangeWit2[1];
          return this._removeThousandsSeparators(_get(_getPrototypeOf(MaskedNumber.prototype), "extractInput", this).call(this, fromPos, toPos, flags));
        }
        /**
          @override
        */

      }, {
        key: "_appendCharRaw",
        value: function _appendCharRaw(ch) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          if (!this.thousandsSeparator) return _get(_getPrototypeOf(MaskedNumber.prototype), "_appendCharRaw", this).call(this, ch, flags);
          var prevBeforeTailValue = flags.tail && flags._beforeTailState ? flags._beforeTailState._value : this._value;

          var prevBeforeTailSeparatorsCount = this._separatorsCountFromSlice(prevBeforeTailValue);

          this._value = this._removeThousandsSeparators(this.value);

          var appendDetails = _get(_getPrototypeOf(MaskedNumber.prototype), "_appendCharRaw", this).call(this, ch, flags);

          this._value = this._insertThousandsSeparators(this._value);
          var beforeTailValue = flags.tail && flags._beforeTailState ? flags._beforeTailState._value : this._value;

          var beforeTailSeparatorsCount = this._separatorsCountFromSlice(beforeTailValue);

          appendDetails.tailShift += (beforeTailSeparatorsCount - prevBeforeTailSeparatorsCount) * this.thousandsSeparator.length;
          appendDetails.skip = !appendDetails.rawInserted && ch === this.thousandsSeparator;
          return appendDetails;
        }
        /** */

      }, {
        key: "_findSeparatorAround",
        value: function _findSeparatorAround(pos) {
          if (this.thousandsSeparator) {
            var searchFrom = pos - this.thousandsSeparator.length + 1;
            var separatorPos = this.value.indexOf(this.thousandsSeparator, searchFrom);
            if (separatorPos <= pos) return separatorPos;
          }

          return -1;
        }
      }, {
        key: "_adjustRangeWithSeparators",
        value: function _adjustRangeWithSeparators(from, to) {
          var separatorAroundFromPos = this._findSeparatorAround(from);

          if (separatorAroundFromPos >= 0) from = separatorAroundFromPos;

          var separatorAroundToPos = this._findSeparatorAround(to);

          if (separatorAroundToPos >= 0) to = separatorAroundToPos + this.thousandsSeparator.length;
          return [from, to];
        }
        /**
          @override
        */

      }, {
        key: "remove",
        value: function remove() {
          var fromPos = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
          var toPos = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.value.length;

          var _this$_adjustRangeWit3 = this._adjustRangeWithSeparators(fromPos, toPos);

          var _this$_adjustRangeWit4 = _slicedToArray(_this$_adjustRangeWit3, 2);

          fromPos = _this$_adjustRangeWit4[0];
          toPos = _this$_adjustRangeWit4[1];
          var valueBeforePos = this.value.slice(0, fromPos);
          var valueAfterPos = this.value.slice(toPos);

          var prevBeforeTailSeparatorsCount = this._separatorsCount(valueBeforePos.length);

          this._value = this._insertThousandsSeparators(this._removeThousandsSeparators(valueBeforePos + valueAfterPos));

          var beforeTailSeparatorsCount = this._separatorsCountFromSlice(valueBeforePos);

          return new ChangeDetails({
            tailShift: (beforeTailSeparatorsCount - prevBeforeTailSeparatorsCount) * this.thousandsSeparator.length
          });
        }
        /**
          @override
        */

      }, {
        key: "nearestInputPos",
        value: function nearestInputPos(cursorPos, direction) {
          if (!this.thousandsSeparator) return cursorPos;

          switch (direction) {
            case DIRECTION.NONE:
            case DIRECTION.LEFT:
            case DIRECTION.FORCE_LEFT:
              {
                var separatorAtLeftPos = this._findSeparatorAround(cursorPos - 1);

                if (separatorAtLeftPos >= 0) {
                  var separatorAtLeftEndPos = separatorAtLeftPos + this.thousandsSeparator.length;

                  if (cursorPos < separatorAtLeftEndPos || this.value.length <= separatorAtLeftEndPos || direction === DIRECTION.FORCE_LEFT) {
                    return separatorAtLeftPos;
                  }
                }

                break;
              }

            case DIRECTION.RIGHT:
            case DIRECTION.FORCE_RIGHT:
              {
                var separatorAtRightPos = this._findSeparatorAround(cursorPos);

                if (separatorAtRightPos >= 0) {
                  return separatorAtRightPos + this.thousandsSeparator.length;
                }
              }
          }

          return cursorPos;
        }
        /**
          @override
        */

      }, {
        key: "doValidate",
        value: function doValidate(flags) {
          var regexp = flags.input ? this._numberRegExpInput : this._numberRegExp; // validate as string

          var valid = regexp.test(this._removeThousandsSeparators(this.value));

          if (valid) {
            // validate as number
            var number = this.number;
            valid = valid && !isNaN(number) && (this.min == null || this.min >= 0 || this.min <= this.number) && (this.max == null || this.max <= 0 || this.number <= this.max);
          }

          return valid && _get(_getPrototypeOf(MaskedNumber.prototype), "doValidate", this).call(this, flags);
        }
        /**
          @override
        */

      }, {
        key: "doCommit",
        value: function doCommit() {
          if (this.value) {
            var number = this.number;
            var validnum = number; // check bounds

            if (this.min != null) validnum = Math.max(validnum, this.min);
            if (this.max != null) validnum = Math.min(validnum, this.max);
            if (validnum !== number) this.unmaskedValue = String(validnum);
            var formatted = this.value;
            if (this.normalizeZeros) formatted = this._normalizeZeros(formatted);
            if (this.padFractionalZeros) formatted = this._padFractionalZeros(formatted);
            this._value = formatted;
          }

          _get(_getPrototypeOf(MaskedNumber.prototype), "doCommit", this).call(this);
        }
        /** */

      }, {
        key: "_normalizeZeros",
        value: function _normalizeZeros(value) {
          var parts = this._removeThousandsSeparators(value).split(this.radix); // remove leading zeros


          parts[0] = parts[0].replace(/^(\D*)(0*)(\d*)/, function (match, sign, zeros, num) {
            return sign + num;
          }); // add leading zero

          if (value.length && !/\d$/.test(parts[0])) parts[0] = parts[0] + '0';

          if (parts.length > 1) {
            parts[1] = parts[1].replace(/0*$/, ''); // remove trailing zeros

            if (!parts[1].length) parts.length = 1; // remove fractional
          }

          return this._insertThousandsSeparators(parts.join(this.radix));
        }
        /** */

      }, {
        key: "_padFractionalZeros",
        value: function _padFractionalZeros(value) {
          if (!value) return value;
          var parts = value.split(this.radix);
          if (parts.length < 2) parts.push('');
          parts[1] = parts[1].padEnd(this.scale, '0');
          return parts.join(this.radix);
        }
        /**
          @override
        */

      }, {
        key: "unmaskedValue",
        get: function get() {
          return this._removeThousandsSeparators(this._normalizeZeros(this.value)).replace(this.radix, '.');
        },
        set: function set(unmaskedValue) {
          _set(_getPrototypeOf(MaskedNumber.prototype), "unmaskedValue", unmaskedValue.replace('.', this.radix), this, true);
        }
        /**
          @override
        */

      }, {
        key: "typedValue",
        get: function get() {
          return Number(this.unmaskedValue);
        },
        set: function set(n) {
          _set(_getPrototypeOf(MaskedNumber.prototype), "unmaskedValue", String(n), this, true);
        }
        /** Parsed Number */

      }, {
        key: "number",
        get: function get() {
          return this.typedValue;
        },
        set: function set(number) {
          this.typedValue = number;
        }
        /**
          Is negative allowed
          @readonly
        */

      }, {
        key: "allowNegative",
        get: function get() {
          return this.signed || this.min != null && this.min < 0 || this.max != null && this.max < 0;
        }
      }]);

      return MaskedNumber;
    }(Masked);
    MaskedNumber.DEFAULTS = {
      radix: ',',
      thousandsSeparator: '',
      mapToRadix: ['.'],
      scale: 2,
      signed: false,
      normalizeZeros: true,
      padFractionalZeros: false
    };
    IMask.MaskedNumber = MaskedNumber;

    /** Masking by custom Function */

    var MaskedFunction = /*#__PURE__*/function (_Masked) {
      _inherits(MaskedFunction, _Masked);

      var _super = _createSuper(MaskedFunction);

      function MaskedFunction() {
        _classCallCheck(this, MaskedFunction);

        return _super.apply(this, arguments);
      }

      _createClass(MaskedFunction, [{
        key: "_update",
        value:
        /**
          @override
          @param {Object} opts
        */
        function _update(opts) {
          if (opts.mask) opts.validate = opts.mask;

          _get(_getPrototypeOf(MaskedFunction.prototype), "_update", this).call(this, opts);
        }
      }]);

      return MaskedFunction;
    }(Masked);
    IMask.MaskedFunction = MaskedFunction;

    var _excluded = ["compiledMasks", "currentMaskRef", "currentMask"];

    /** Dynamic mask for choosing apropriate mask in run-time */
    var MaskedDynamic = /*#__PURE__*/function (_Masked) {
      _inherits(MaskedDynamic, _Masked);

      var _super = _createSuper(MaskedDynamic);

      /** Currently chosen mask */

      /** Compliled {@link Masked} options */

      /** Chooses {@link Masked} depending on input value */

      /**
        @param {Object} opts
      */
      function MaskedDynamic(opts) {
        var _this;

        _classCallCheck(this, MaskedDynamic);

        _this = _super.call(this, Object.assign({}, MaskedDynamic.DEFAULTS, opts));
        _this.currentMask = null;
        return _this;
      }
      /**
        @override
      */


      _createClass(MaskedDynamic, [{
        key: "_update",
        value: function _update(opts) {
          _get(_getPrototypeOf(MaskedDynamic.prototype), "_update", this).call(this, opts);

          if ('mask' in opts) {
            // mask could be totally dynamic with only `dispatch` option
            this.compiledMasks = Array.isArray(opts.mask) ? opts.mask.map(function (m) {
              return createMask(m);
            }) : [];
          }
        }
        /**
          @override
        */

      }, {
        key: "_appendCharRaw",
        value: function _appendCharRaw(ch) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

          var details = this._applyDispatch(ch, flags);

          if (this.currentMask) {
            details.aggregate(this.currentMask._appendChar(ch, flags));
          }

          return details;
        }
      }, {
        key: "_applyDispatch",
        value: function _applyDispatch() {
          var appended = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          var prevValueBeforeTail = flags.tail && flags._beforeTailState != null ? flags._beforeTailState._value : this.value;
          var inputValue = this.rawInputValue;
          var insertValue = flags.tail && flags._beforeTailState != null ? // $FlowFixMe - tired to fight with type system
          flags._beforeTailState._rawInputValue : inputValue;
          var tailValue = inputValue.slice(insertValue.length);
          var prevMask = this.currentMask;
          var details = new ChangeDetails();
          var prevMaskState = prevMask && prevMask.state; // clone flags to prevent overwriting `_beforeTailState`

          this.currentMask = this.doDispatch(appended, Object.assign({}, flags)); // restore state after dispatch

          if (this.currentMask) {
            if (this.currentMask !== prevMask) {
              // if mask changed reapply input
              this.currentMask.reset();

              if (insertValue) {
                // $FlowFixMe - it's ok, we don't change current mask above
                var d = this.currentMask.append(insertValue, {
                  raw: true
                });
                details.tailShift = d.inserted.length - prevValueBeforeTail.length;
              }

              if (tailValue) {
                // $FlowFixMe - it's ok, we don't change current mask above
                details.tailShift += this.currentMask.append(tailValue, {
                  raw: true,
                  tail: true
                }).tailShift;
              }
            } else {
              // Dispatch can do something bad with state, so
              // restore prev mask state
              this.currentMask.state = prevMaskState;
            }
          }

          return details;
        }
      }, {
        key: "_appendPlaceholder",
        value: function _appendPlaceholder() {
          var details = this._applyDispatch.apply(this, arguments);

          if (this.currentMask) {
            details.aggregate(this.currentMask._appendPlaceholder());
          }

          return details;
        }
        /**
          @override
        */

      }, {
        key: "doDispatch",
        value: function doDispatch(appended) {
          var flags = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
          return this.dispatch(appended, this, flags);
        }
        /**
          @override
        */

      }, {
        key: "doValidate",
        value: function doValidate() {
          var _get2, _this$currentMask;

          for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return (_get2 = _get(_getPrototypeOf(MaskedDynamic.prototype), "doValidate", this)).call.apply(_get2, [this].concat(args)) && (!this.currentMask || (_this$currentMask = this.currentMask).doValidate.apply(_this$currentMask, args));
        }
        /**
          @override
        */

      }, {
        key: "reset",
        value: function reset() {
          if (this.currentMask) this.currentMask.reset();
          this.compiledMasks.forEach(function (m) {
            return m.reset();
          });
        }
        /**
          @override
        */

      }, {
        key: "value",
        get: function get() {
          return this.currentMask ? this.currentMask.value : '';
        },
        set: function set(value) {
          _set(_getPrototypeOf(MaskedDynamic.prototype), "value", value, this, true);
        }
        /**
          @override
        */

      }, {
        key: "unmaskedValue",
        get: function get() {
          return this.currentMask ? this.currentMask.unmaskedValue : '';
        },
        set: function set(unmaskedValue) {
          _set(_getPrototypeOf(MaskedDynamic.prototype), "unmaskedValue", unmaskedValue, this, true);
        }
        /**
          @override
        */

      }, {
        key: "typedValue",
        get: function get() {
          return this.currentMask ? this.currentMask.typedValue : '';
        } // probably typedValue should not be used with dynamic
        ,
        set: function set(value) {
          var unmaskedValue = String(value); // double check it

          if (this.currentMask) {
            this.currentMask.typedValue = value;
            unmaskedValue = this.currentMask.unmaskedValue;
          }

          this.unmaskedValue = unmaskedValue;
        }
        /**
          @override
        */

      }, {
        key: "isComplete",
        get: function get() {
          return !!this.currentMask && this.currentMask.isComplete;
        }
        /**
          @override
        */

      }, {
        key: "remove",
        value: function remove() {
          var details = new ChangeDetails();

          if (this.currentMask) {
            var _this$currentMask2;

            details.aggregate((_this$currentMask2 = this.currentMask).remove.apply(_this$currentMask2, arguments)) // update with dispatch
            .aggregate(this._applyDispatch());
          }

          return details;
        }
        /**
          @override
        */

      }, {
        key: "state",
        get: function get() {
          return Object.assign({}, _get(_getPrototypeOf(MaskedDynamic.prototype), "state", this), {
            _rawInputValue: this.rawInputValue,
            compiledMasks: this.compiledMasks.map(function (m) {
              return m.state;
            }),
            currentMaskRef: this.currentMask,
            currentMask: this.currentMask && this.currentMask.state
          });
        },
        set: function set(state) {
          var compiledMasks = state.compiledMasks,
              currentMaskRef = state.currentMaskRef,
              currentMask = state.currentMask,
              maskedState = _objectWithoutProperties(state, _excluded);

          this.compiledMasks.forEach(function (m, mi) {
            return m.state = compiledMasks[mi];
          });

          if (currentMaskRef != null) {
            this.currentMask = currentMaskRef;
            this.currentMask.state = currentMask;
          }

          _set(_getPrototypeOf(MaskedDynamic.prototype), "state", maskedState, this, true);
        }
        /**
          @override
        */

      }, {
        key: "extractInput",
        value: function extractInput() {
          var _this$currentMask3;

          return this.currentMask ? (_this$currentMask3 = this.currentMask).extractInput.apply(_this$currentMask3, arguments) : '';
        }
        /**
          @override
        */

      }, {
        key: "extractTail",
        value: function extractTail() {
          var _this$currentMask4, _get3;

          for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          return this.currentMask ? (_this$currentMask4 = this.currentMask).extractTail.apply(_this$currentMask4, args) : (_get3 = _get(_getPrototypeOf(MaskedDynamic.prototype), "extractTail", this)).call.apply(_get3, [this].concat(args));
        }
        /**
          @override
        */

      }, {
        key: "doCommit",
        value: function doCommit() {
          if (this.currentMask) this.currentMask.doCommit();

          _get(_getPrototypeOf(MaskedDynamic.prototype), "doCommit", this).call(this);
        }
        /**
          @override
        */

      }, {
        key: "nearestInputPos",
        value: function nearestInputPos() {
          var _this$currentMask5, _get4;

          for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
          }

          return this.currentMask ? (_this$currentMask5 = this.currentMask).nearestInputPos.apply(_this$currentMask5, args) : (_get4 = _get(_getPrototypeOf(MaskedDynamic.prototype), "nearestInputPos", this)).call.apply(_get4, [this].concat(args));
        }
      }, {
        key: "overwrite",
        get: function get() {
          return this.currentMask ? this.currentMask.overwrite : _get(_getPrototypeOf(MaskedDynamic.prototype), "overwrite", this);
        },
        set: function set(overwrite) {
          console.warn('"overwrite" option is not available in dynamic mask, use this option in siblings');
        }
      }]);

      return MaskedDynamic;
    }(Masked);
    MaskedDynamic.DEFAULTS = {
      dispatch: function dispatch(appended, masked, flags) {
        if (!masked.compiledMasks.length) return;
        var inputValue = masked.rawInputValue; // simulate input

        var inputs = masked.compiledMasks.map(function (m, index) {
          m.reset();
          m.append(inputValue, {
            raw: true
          });
          m.append(appended, flags);
          var weight = m.rawInputValue.length;
          return {
            weight: weight,
            index: index
          };
        }); // pop masks with longer values first

        inputs.sort(function (i1, i2) {
          return i2.weight - i1.weight;
        });
        return masked.compiledMasks[inputs[0].index];
      }
    };
    IMask.MaskedDynamic = MaskedDynamic;

    /** Mask pipe source and destination types */

    var PIPE_TYPE = {
      MASKED: 'value',
      UNMASKED: 'unmaskedValue',
      TYPED: 'typedValue'
    };
    /** Creates new pipe function depending on mask type, source and destination options */

    function createPipe(mask) {
      var from = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : PIPE_TYPE.MASKED;
      var to = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : PIPE_TYPE.MASKED;
      var masked = createMask(mask);
      return function (value) {
        return masked.runIsolated(function (m) {
          m[from] = value;
          return m[to];
        });
      };
    }
    /** Pipes value through mask depending on mask type, source and destination options */

    function pipe(value) {
      for (var _len = arguments.length, pipeArgs = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        pipeArgs[_key - 1] = arguments[_key];
      }

      return createPipe.apply(void 0, pipeArgs)(value);
    }
    IMask.PIPE_TYPE = PIPE_TYPE;
    IMask.createPipe = createPipe;
    IMask.pipe = pipe;

    try {
      globalThis.IMask = IMask;
    } catch (e) {}

    var esm = /*#__PURE__*/Object.freeze({
        __proto__: null,
        InputMask: InputMask,
        'default': IMask,
        Masked: Masked,
        MaskedPattern: MaskedPattern,
        MaskedEnum: MaskedEnum,
        MaskedRange: MaskedRange,
        MaskedNumber: MaskedNumber,
        MaskedDate: MaskedDate,
        MaskedRegExp: MaskedRegExp,
        MaskedFunction: MaskedFunction,
        MaskedDynamic: MaskedDynamic,
        createMask: createMask,
        MaskElement: MaskElement,
        HTMLMaskElement: HTMLMaskElement,
        HTMLContenteditableMaskElement: HTMLContenteditableMaskElement,
        PIPE_TYPE: PIPE_TYPE,
        createPipe: createPipe,
        pipe: pipe
    });

    var require$$0 = /*@__PURE__*/getAugmentedNamespace(esm);

    (function (module, exports) {
    (function (global, factory) {
      factory(exports, require$$0) ;
    }(commonjsGlobal, (function (exports, IMask) {
      function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

      var IMask__default = /*#__PURE__*/_interopDefaultLegacy(IMask);

      function fireEvent(el, eventName, data) {
        var e = document.createEvent('CustomEvent');
        e.initCustomEvent(eventName, true, true, data);
        el.dispatchEvent(e);
      }

      function initMask(el, opts) {
        var maskRef = opts instanceof IMask__default['default'].InputMask ? opts : IMask__default['default'](el, opts);
        return maskRef.on('accept', function () {
          return fireEvent(el, 'accept', maskRef);
        }).on('complete', function () {
          return fireEvent(el, 'complete', maskRef);
        });
      }

      function IMaskAction(el, options) {
        var maskRef = options && initMask(el, options);

        function destroy() {
          if (maskRef) {
            maskRef.destroy();
            maskRef = undefined;
          }
        }

        function update(options) {
          if (options) {
            if (maskRef) {
              if (options instanceof IMask__default['default'].InputMask) maskRef = options;else maskRef.updateOptions(options);
            } else maskRef = initMask(el, options);
          } else {
            destroy();
          }
        }

        return {
          update: update,
          destroy: destroy
        };
      }

      exports.imask = IMaskAction;

      Object.defineProperty(exports, '__esModule', { value: true });

    })));

    }(svelteImask, svelteImask.exports));

    /* src/UI/components/Input/Input.svelte generated by Svelte v3.46.4 */

    function create_if_block_10(ctx) {
    	let span;
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(/*label*/ ctx[1]);
    			attr(span, "class", "input__label");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*label*/ 2) set_data(t, /*label*/ ctx[1]);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (115:4) {:else}
    function create_else_block_3(ctx) {
    	let input_1;
    	let input_1_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input_1 = element("input");
    			attr(input_1, "type", "text");
    			attr(input_1, "autocomplete", /*autocomplete*/ ctx[10]);
    			attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			input_1.disabled = input_1_disabled_value = !/*isActive*/ ctx[3];
    			toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    		},
    		m(target, anchor) {
    			insert(target, input_1, anchor);
    			set_input_value(input_1, /*value*/ ctx[0]);
    			/*input_1_binding_5*/ ctx[59](input_1);

    			if (!mounted) {
    				dispose = [
    					listen(input_1, "input", /*input_1_input_handler_5*/ ctx[58]),
    					listen(input_1, "keyup", /*keyup_handler_5*/ ctx[43]),
    					listen(input_1, "keydown", /*keydown_handler_5*/ ctx[44]),
    					listen(input_1, "input", /*input_handler_5*/ ctx[45]),
    					listen(input_1, "change", /*change_handler_5*/ ctx[46]),
    					listen(input_1, "click", /*click_handler_5*/ ctx[47])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*autocomplete*/ 1024) {
    				attr(input_1, "autocomplete", /*autocomplete*/ ctx[10]);
    			}

    			if (dirty[0] & /*placeholder*/ 4) {
    				attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty[0] & /*isActive*/ 8 && input_1_disabled_value !== (input_1_disabled_value = !/*isActive*/ ctx[3])) {
    				input_1.disabled = input_1_disabled_value;
    			}

    			if (dirty[0] & /*value*/ 1 && input_1.value !== /*value*/ ctx[0]) {
    				set_input_value(input_1, /*value*/ ctx[0]);
    			}

    			if (dirty[0] & /*themeIsRounded*/ 32768) {
    				toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(input_1);
    			/*input_1_binding_5*/ ctx[59](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (99:27) 
    function create_if_block_9(ctx) {
    	let input_1;
    	let input_1_disabled_value;
    	let imask_action;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input_1 = element("input");
    			attr(input_1, "type", "text");
    			attr(input_1, "autocomplete", /*autocomplete*/ ctx[10]);
    			attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			input_1.disabled = input_1_disabled_value = !/*isActive*/ ctx[3];
    			toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    		},
    		m(target, anchor) {
    			insert(target, input_1, anchor);
    			set_input_value(input_1, /*value*/ ctx[0]);
    			/*input_1_binding_4*/ ctx[57](input_1);

    			if (!mounted) {
    				dispose = [
    					listen(input_1, "input", /*input_1_input_handler_4*/ ctx[56]),
    					listen(input_1, "keyup", /*keyup_handler_4*/ ctx[38]),
    					listen(input_1, "keydown", /*keydown_handler_4*/ ctx[39]),
    					listen(input_1, "input", /*input_handler_4*/ ctx[40]),
    					listen(input_1, "change", /*change_handler_4*/ ctx[41]),
    					listen(input_1, "click", /*click_handler_4*/ ctx[42]),
    					action_destroyer(imask_action = svelteImask.exports.imask.call(null, input_1, /*imaskOptions*/ ctx[9]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*autocomplete*/ 1024) {
    				attr(input_1, "autocomplete", /*autocomplete*/ ctx[10]);
    			}

    			if (dirty[0] & /*placeholder*/ 4) {
    				attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty[0] & /*isActive*/ 8 && input_1_disabled_value !== (input_1_disabled_value = !/*isActive*/ ctx[3])) {
    				input_1.disabled = input_1_disabled_value;
    			}

    			if (dirty[0] & /*value*/ 1 && input_1.value !== /*value*/ ctx[0]) {
    				set_input_value(input_1, /*value*/ ctx[0]);
    			}

    			if (imask_action && is_function(imask_action.update) && dirty[0] & /*imaskOptions*/ 512) imask_action.update.call(null, /*imaskOptions*/ ctx[9]);

    			if (dirty[0] & /*themeIsRounded*/ 32768) {
    				toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(input_1);
    			/*input_1_binding_4*/ ctx[57](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (66:23) 
    function create_if_block_7(ctx) {
    	let if_block_anchor;

    	function select_block_type_2(ctx, dirty) {
    		if (/*imaskOptions*/ ctx[9]) return create_if_block_8;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (36:4) {#if isPassword}
    function create_if_block_5(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*passwordHidden*/ ctx[14]) return create_if_block_6;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_block.m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    		},
    		p(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    // (83:8) {:else}
    function create_else_block_2(ctx) {
    	let input_1;
    	let input_1_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input_1 = element("input");
    			attr(input_1, "type", "number");
    			attr(input_1, "autocomplete", /*autocomplete*/ ctx[10]);
    			attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			input_1.disabled = input_1_disabled_value = !/*isActive*/ ctx[3];
    			toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    		},
    		m(target, anchor) {
    			insert(target, input_1, anchor);
    			set_input_value(input_1, /*value*/ ctx[0]);
    			/*input_1_binding_3*/ ctx[55](input_1);

    			if (!mounted) {
    				dispose = [
    					listen(input_1, "input", /*input_1_input_handler_3*/ ctx[54]),
    					listen(input_1, "keyup", /*keyup_handler_3*/ ctx[33]),
    					listen(input_1, "keydown", /*keydown_handler_3*/ ctx[34]),
    					listen(input_1, "input", /*input_handler_3*/ ctx[35]),
    					listen(input_1, "change", /*change_handler_3*/ ctx[36]),
    					listen(input_1, "click", /*click_handler_3*/ ctx[37])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*autocomplete*/ 1024) {
    				attr(input_1, "autocomplete", /*autocomplete*/ ctx[10]);
    			}

    			if (dirty[0] & /*placeholder*/ 4) {
    				attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty[0] & /*isActive*/ 8 && input_1_disabled_value !== (input_1_disabled_value = !/*isActive*/ ctx[3])) {
    				input_1.disabled = input_1_disabled_value;
    			}

    			if (dirty[0] & /*value*/ 1 && to_number(input_1.value) !== /*value*/ ctx[0]) {
    				set_input_value(input_1, /*value*/ ctx[0]);
    			}

    			if (dirty[0] & /*themeIsRounded*/ 32768) {
    				toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(input_1);
    			/*input_1_binding_3*/ ctx[55](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (67:8) {#if imaskOptions}
    function create_if_block_8(ctx) {
    	let input_1;
    	let input_1_disabled_value;
    	let imask_action;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input_1 = element("input");
    			attr(input_1, "type", "number");
    			attr(input_1, "autocomplete", /*autocomplete*/ ctx[10]);
    			attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			input_1.disabled = input_1_disabled_value = !/*isActive*/ ctx[3];
    			toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    		},
    		m(target, anchor) {
    			insert(target, input_1, anchor);
    			set_input_value(input_1, /*value*/ ctx[0]);
    			/*input_1_binding_2*/ ctx[53](input_1);

    			if (!mounted) {
    				dispose = [
    					listen(input_1, "input", /*input_1_input_handler_2*/ ctx[52]),
    					listen(input_1, "keyup", /*keyup_handler_2*/ ctx[28]),
    					listen(input_1, "keydown", /*keydown_handler_2*/ ctx[29]),
    					listen(input_1, "input", /*input_handler_2*/ ctx[30]),
    					listen(input_1, "change", /*change_handler_2*/ ctx[31]),
    					listen(input_1, "click", /*click_handler_2*/ ctx[32]),
    					action_destroyer(imask_action = svelteImask.exports.imask.call(null, input_1, /*imaskOptions*/ ctx[9]))
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*autocomplete*/ 1024) {
    				attr(input_1, "autocomplete", /*autocomplete*/ ctx[10]);
    			}

    			if (dirty[0] & /*placeholder*/ 4) {
    				attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty[0] & /*isActive*/ 8 && input_1_disabled_value !== (input_1_disabled_value = !/*isActive*/ ctx[3])) {
    				input_1.disabled = input_1_disabled_value;
    			}

    			if (dirty[0] & /*value*/ 1 && to_number(input_1.value) !== /*value*/ ctx[0]) {
    				set_input_value(input_1, /*value*/ ctx[0]);
    			}

    			if (imask_action && is_function(imask_action.update) && dirty[0] & /*imaskOptions*/ 512) imask_action.update.call(null, /*imaskOptions*/ ctx[9]);

    			if (dirty[0] & /*themeIsRounded*/ 32768) {
    				toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(input_1);
    			/*input_1_binding_2*/ ctx[53](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (51:8) {:else}
    function create_else_block_1(ctx) {
    	let input_1;
    	let input_1_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input_1 = element("input");
    			attr(input_1, "type", "text");
    			attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			input_1.disabled = input_1_disabled_value = !/*isActive*/ ctx[3];
    			toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    		},
    		m(target, anchor) {
    			insert(target, input_1, anchor);
    			set_input_value(input_1, /*value*/ ctx[0]);
    			/*input_1_binding_1*/ ctx[51](input_1);

    			if (!mounted) {
    				dispose = [
    					listen(input_1, "input", /*input_1_input_handler_1*/ ctx[50]),
    					listen(input_1, "keyup", /*keyup_handler_1*/ ctx[23]),
    					listen(input_1, "keydown", /*keydown_handler_1*/ ctx[24]),
    					listen(input_1, "input", /*input_handler_1*/ ctx[25]),
    					listen(input_1, "change", /*change_handler_1*/ ctx[26]),
    					listen(input_1, "click", /*click_handler_1*/ ctx[27])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*placeholder*/ 4) {
    				attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty[0] & /*isActive*/ 8 && input_1_disabled_value !== (input_1_disabled_value = !/*isActive*/ ctx[3])) {
    				input_1.disabled = input_1_disabled_value;
    			}

    			if (dirty[0] & /*value*/ 1 && input_1.value !== /*value*/ ctx[0]) {
    				set_input_value(input_1, /*value*/ ctx[0]);
    			}

    			if (dirty[0] & /*themeIsRounded*/ 32768) {
    				toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(input_1);
    			/*input_1_binding_1*/ ctx[51](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (37:8) {#if passwordHidden}
    function create_if_block_6(ctx) {
    	let input_1;
    	let input_1_disabled_value;
    	let mounted;
    	let dispose;

    	return {
    		c() {
    			input_1 = element("input");
    			attr(input_1, "type", "password");
    			attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			input_1.disabled = input_1_disabled_value = !/*isActive*/ ctx[3];
    			toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    		},
    		m(target, anchor) {
    			insert(target, input_1, anchor);
    			set_input_value(input_1, /*value*/ ctx[0]);
    			/*input_1_binding*/ ctx[49](input_1);

    			if (!mounted) {
    				dispose = [
    					listen(input_1, "input", /*input_1_input_handler*/ ctx[48]),
    					listen(input_1, "keyup", /*keyup_handler*/ ctx[18]),
    					listen(input_1, "keydown", /*keydown_handler*/ ctx[19]),
    					listen(input_1, "input", /*input_handler*/ ctx[20]),
    					listen(input_1, "change", /*change_handler*/ ctx[21]),
    					listen(input_1, "click", /*click_handler*/ ctx[22])
    				];

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*placeholder*/ 4) {
    				attr(input_1, "placeholder", /*placeholder*/ ctx[2]);
    			}

    			if (dirty[0] & /*isActive*/ 8 && input_1_disabled_value !== (input_1_disabled_value = !/*isActive*/ ctx[3])) {
    				input_1.disabled = input_1_disabled_value;
    			}

    			if (dirty[0] & /*value*/ 1 && input_1.value !== /*value*/ ctx[0]) {
    				set_input_value(input_1, /*value*/ ctx[0]);
    			}

    			if (dirty[0] & /*themeIsRounded*/ 32768) {
    				toggle_class(input_1, "rounded_light", /*themeIsRounded*/ ctx[15]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(input_1);
    			/*input_1_binding*/ ctx[49](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    // (131:4) {#if rightLabel || isPassword}
    function create_if_block_1(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*rightLabel*/ ctx[6] && create_if_block_4(ctx);
    	let if_block1 = /*isPassword*/ ctx[7] && create_if_block_2(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr(div, "class", "right");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p(ctx, dirty) {
    			if (/*rightLabel*/ ctx[6]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*isPassword*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};
    }

    // (133:12) {#if rightLabel}
    function create_if_block_4(ctx) {
    	let span;
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(/*rightLabel*/ ctx[6]);
    			attr(span, "class", "right__label");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*rightLabel*/ 64) set_data(t, /*rightLabel*/ ctx[6]);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    // (136:12) {#if isPassword}
    function create_if_block_2(ctx) {
    	let div;
    	let mounted;
    	let dispose;

    	function select_block_type_3(ctx, dirty) {
    		if (/*passwordHidden*/ ctx[14]) return create_if_block_3;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_3(ctx);
    	let if_block = current_block_type(ctx);

    	return {
    		c() {
    			div = element("div");
    			if_block.c();
    			attr(div, "class", "right__eye");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if_block.m(div, null);

    			if (!mounted) {
    				dispose = listen(div, "click", /*click_handler_6*/ ctx[60]);
    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (current_block_type !== (current_block_type = select_block_type_3(ctx))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    // (150:20) {:else}
    function create_else_block$1(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "d", "M2.125 4C4.75 5.5 8.88829 5.68906 11.875 4M1 4C1 3.25 4 1 7 1C10 1 13 3.25 13 4C13 4.75 10.75 7 7 7C3.25 7 1 4.75 1 4Z");
    			attr(path, "stroke", "#707070");
    			attr(path, "stroke-linecap", "round");
    			attr(path, "stroke-linejoin", "round");
    			attr(svg, "width", "14");
    			attr(svg, "height", "8");
    			attr(svg, "viewBox", "0 0 14 8");
    			attr(svg, "fill", "none");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (143:20) {#if passwordHidden}
    function create_if_block_3(ctx) {
    	let svg;
    	let path;

    	return {
    		c() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr(path, "d", "M6.25 3.5C6.25 3.5 6 5 6.25 4.75C6.5 4.5 6.45328 3.64375 7.75 3.5M6.25 3.5V3.25H7.75C7.75 3.25 7.75 3 7.75 3.5M6.25 3.5H7.75M1 4C1 3.25 4 1 7 1C10 1 13 3.25 13 4C13 4.75 10.75 7 7 7C3.25 7 1 4.75 1 4ZM8.5 4V4C8.5 4.82843 7.82843 5.5 7 5.5V5.5C6.17157 5.5 5.5 4.82843 5.5 4V4C5.5 3.17157 6.17157 2.5 7 2.5V2.5C7.82843 2.5 8.5 3.17157 8.5 4Z");
    			attr(path, "stroke", "#707070");
    			attr(svg, "width", "14");
    			attr(svg, "height", "8");
    			attr(svg, "viewBox", "0 0 14 8");
    			attr(svg, "fill", "none");
    			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
    		},
    		m(target, anchor) {
    			insert(target, svg, anchor);
    			append(svg, path);
    		},
    		d(detaching) {
    			if (detaching) detach(svg);
    		}
    	};
    }

    // (164:4) {#if incorrect}
    function create_if_block$2(ctx) {
    	let span;
    	let t;

    	return {
    		c() {
    			span = element("span");
    			t = text(/*incorrect*/ ctx[4]);
    			attr(span, "class", "input__incorrect-label");
    		},
    		m(target, anchor) {
    			insert(target, span, anchor);
    			append(span, t);
    		},
    		p(ctx, dirty) {
    			if (dirty[0] & /*incorrect*/ 16) set_data(t, /*incorrect*/ ctx[4]);
    		},
    		d(detaching) {
    			if (detaching) detach(span);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let interactiveElement_action;
    	let mounted;
    	let dispose;
    	let if_block0 = /*label*/ ctx[1] && create_if_block_10(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*isPassword*/ ctx[7]) return create_if_block_5;
    		if (/*isNumber*/ ctx[8]) return create_if_block_7;
    		if (/*imaskOptions*/ ctx[9]) return create_if_block_9;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	let if_block2 = (/*rightLabel*/ ctx[6] || /*isPassword*/ ctx[7]) && create_if_block_1(ctx);
    	let if_block3 = /*incorrect*/ ctx[4] && create_if_block$2(ctx);

    	return {
    		c() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			attr(div, "class", "input");
    			toggle_class(div, "incorrect", /*incorrect*/ ctx[4]);
    			toggle_class(div, "disabled", !/*isActive*/ ctx[3]);
    			toggle_class(div, "stretched", /*isStretched*/ ctx[5]);
    			toggle_class(div, "centered", /*isCentered*/ ctx[11]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append(div, t0);
    			if_block1.m(div, null);
    			append(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append(div, t2);
    			if (if_block3) if_block3.m(div, null);

    			if (!mounted) {
    				dispose = action_destroyer(interactiveElement_action = interactiveElement.call(null, div, {
    					isActive: /*$_theme*/ ctx[12].isInteractiveCursor && /*isActive*/ ctx[3]
    				}));

    				mounted = true;
    			}
    		},
    		p(ctx, dirty) {
    			if (/*label*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_10(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div, t1);
    				}
    			}

    			if (/*rightLabel*/ ctx[6] || /*isPassword*/ ctx[7]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*incorrect*/ ctx[4]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$2(ctx);
    					if_block3.c();
    					if_block3.m(div, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (interactiveElement_action && is_function(interactiveElement_action.update) && dirty[0] & /*$_theme, isActive*/ 4104) interactiveElement_action.update.call(null, {
    				isActive: /*$_theme*/ ctx[12].isInteractiveCursor && /*isActive*/ ctx[3]
    			});

    			if (dirty[0] & /*incorrect*/ 16) {
    				toggle_class(div, "incorrect", /*incorrect*/ ctx[4]);
    			}

    			if (dirty[0] & /*isActive*/ 8) {
    				toggle_class(div, "disabled", !/*isActive*/ ctx[3]);
    			}

    			if (dirty[0] & /*isStretched*/ 32) {
    				toggle_class(div, "stretched", /*isStretched*/ ctx[5]);
    			}

    			if (dirty[0] & /*isCentered*/ 2048) {
    				toggle_class(div, "centered", /*isCentered*/ ctx[11]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			mounted = false;
    			dispose();
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let themeIsRounded;
    	let $_theme;
    	component_subscribe($$self, _theme, $$value => $$invalidate(12, $_theme = $$value));
    	let { value = '' } = $$props;
    	let { label = false } = $$props;
    	let { placeholder = '' } = $$props;
    	let { isActive = true } = $$props;
    	let { incorrect = false } = $$props;
    	let { isStretched = false } = $$props;
    	let { isRounded } = $$props;
    	let { rightLabel = false } = $$props;
    	let { isPassword = false } = $$props;
    	let { isNumber = false } = $$props;
    	let { imaskOptions = false } = $$props;
    	let { autocomplete = 'off' } = $$props;
    	let { isCentered = false } = $$props;

    	function focus() {
    		input.focus();
    	}

    	let input;
    	let passwordHidden = true;

    	function keyup_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_1(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_2(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_3(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler_4(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler_4(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_4(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler_4(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_4(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keyup_handler_5(event) {
    		bubble.call(this, $$self, event);
    	}

    	function keydown_handler_5(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_handler_5(event) {
    		bubble.call(this, $$self, event);
    	}

    	function change_handler_5(event) {
    		bubble.call(this, $$self, event);
    	}

    	function click_handler_5(event) {
    		bubble.call(this, $$self, event);
    	}

    	function input_1_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			input = $$value;
    			$$invalidate(13, input);
    		});
    	}

    	function input_1_input_handler_1() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_1_binding_1($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			input = $$value;
    			$$invalidate(13, input);
    		});
    	}

    	function input_1_input_handler_2() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	function input_1_binding_2($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			input = $$value;
    			$$invalidate(13, input);
    		});
    	}

    	function input_1_input_handler_3() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	function input_1_binding_3($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			input = $$value;
    			$$invalidate(13, input);
    		});
    	}

    	function input_1_input_handler_4() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_1_binding_4($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			input = $$value;
    			$$invalidate(13, input);
    		});
    	}

    	function input_1_input_handler_5() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_1_binding_5($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			input = $$value;
    			$$invalidate(13, input);
    		});
    	}

    	const click_handler_6 = () => {
    		$$invalidate(14, passwordHidden = !passwordHidden);
    	};

    	$$self.$$set = $$props => {
    		if ('value' in $$props) $$invalidate(0, value = $$props.value);
    		if ('label' in $$props) $$invalidate(1, label = $$props.label);
    		if ('placeholder' in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ('isActive' in $$props) $$invalidate(3, isActive = $$props.isActive);
    		if ('incorrect' in $$props) $$invalidate(4, incorrect = $$props.incorrect);
    		if ('isStretched' in $$props) $$invalidate(5, isStretched = $$props.isStretched);
    		if ('isRounded' in $$props) $$invalidate(16, isRounded = $$props.isRounded);
    		if ('rightLabel' in $$props) $$invalidate(6, rightLabel = $$props.rightLabel);
    		if ('isPassword' in $$props) $$invalidate(7, isPassword = $$props.isPassword);
    		if ('isNumber' in $$props) $$invalidate(8, isNumber = $$props.isNumber);
    		if ('imaskOptions' in $$props) $$invalidate(9, imaskOptions = $$props.imaskOptions);
    		if ('autocomplete' in $$props) $$invalidate(10, autocomplete = $$props.autocomplete);
    		if ('isCentered' in $$props) $$invalidate(11, isCentered = $$props.isCentered);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*isRounded, $_theme*/ 69632) {
    			$$invalidate(15, themeIsRounded = isRounded === undefined ? $_theme.isRounded : isRounded);
    		}
    	};

    	return [
    		value,
    		label,
    		placeholder,
    		isActive,
    		incorrect,
    		isStretched,
    		rightLabel,
    		isPassword,
    		isNumber,
    		imaskOptions,
    		autocomplete,
    		isCentered,
    		$_theme,
    		input,
    		passwordHidden,
    		themeIsRounded,
    		isRounded,
    		focus,
    		keyup_handler,
    		keydown_handler,
    		input_handler,
    		change_handler,
    		click_handler,
    		keyup_handler_1,
    		keydown_handler_1,
    		input_handler_1,
    		change_handler_1,
    		click_handler_1,
    		keyup_handler_2,
    		keydown_handler_2,
    		input_handler_2,
    		change_handler_2,
    		click_handler_2,
    		keyup_handler_3,
    		keydown_handler_3,
    		input_handler_3,
    		change_handler_3,
    		click_handler_3,
    		keyup_handler_4,
    		keydown_handler_4,
    		input_handler_4,
    		change_handler_4,
    		click_handler_4,
    		keyup_handler_5,
    		keydown_handler_5,
    		input_handler_5,
    		change_handler_5,
    		click_handler_5,
    		input_1_input_handler,
    		input_1_binding,
    		input_1_input_handler_1,
    		input_1_binding_1,
    		input_1_input_handler_2,
    		input_1_binding_2,
    		input_1_input_handler_3,
    		input_1_binding_3,
    		input_1_input_handler_4,
    		input_1_binding_4,
    		input_1_input_handler_5,
    		input_1_binding_5,
    		click_handler_6
    	];
    }

    class Input extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				value: 0,
    				label: 1,
    				placeholder: 2,
    				isActive: 3,
    				incorrect: 4,
    				isStretched: 5,
    				isRounded: 16,
    				rightLabel: 6,
    				isPassword: 7,
    				isNumber: 8,
    				imaskOptions: 9,
    				autocomplete: 10,
    				isCentered: 11,
    				focus: 17
    			},
    			null,
    			[-1, -1]
    		);
    	}

    	get focus() {
    		return this.$$.ctx[17];
    	}
    }

    const colors = [
        ['F2793D', 'F89E39'],
        ['F5576C', 'F093FB'],
        ['4FACFE', '00F2FE'],
        ['43E97B', '38F9D7'],
        ['FA709A', 'FEB240'],
        ['210867', '3083D0'],
        ['66A6FF', '8995FE'],
        ['96E6A1', 'D4FC79'],
        ['009EFD', '2AF5D0'],
        ['B465DA', 'EE609C'],
        ['6A11CB', '2575FC'],
        ['764BA2', '667EEA'],
        ['C471F5', 'FA71CD'],
        ['FF0844', 'FFB199'],
        ['FF5E71', 'FF7EB3'],
        ['FF5858', 'F09819'],
        ['00CDAC', '8DDAD5'],
        ['4481EB', '04BEFE'],
        ['C71D6F', 'E87771'],
        ['5F72BD', '9B23EA'],
        ['0FD850', 'CBF947'],
        ['F83600', 'F9A323'],
        ['495AFF', '0ACFFE'],
        ['595EFF', 'B224EF'],
    ];
    function getGradientById(id) {
        let index;
        if (!id || typeof id !== 'number')
            index = 0;
        else
            index = id % colors.length;
        return `linear-gradient(180deg, #${colors[index][0]} 0%, #${colors[index][1]} 100%)`;
    }

    /* src/UI/components/Avatar/Avatar.svelte generated by Svelte v3.46.4 */

    function create_if_block$1(ctx) {
    	let div;

    	return {
    		c() {
    			div = element("div");
    			attr(div, "class", "avatar__online");
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;

    	let t0_value = (/*name*/ ctx[1] && !/*image*/ ctx[0]
    	? /*name*/ ctx[1].charAt(0).toUpperCase()
    	: '') + "";

    	let t0;
    	let t1;
    	let div1_class_value;
    	let if_block = /*isOnline*/ ctx[5] && create_if_block$1();

    	return {
    		c() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			attr(div0, "class", "avatar__inner");

    			set_style(div0, "background-image", /*image*/ ctx[0]
    			? `url(${/*image*/ ctx[0]})`
    			: getGradientById(/*id*/ ctx[2] || 0));

    			attr(div1, "class", div1_class_value = "avatar avatar_variant_" + /*variant*/ ctx[4] + " avatar_size_" + /*size*/ ctx[3]);
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			append(div0, t0);
    			append(div1, t1);
    			if (if_block) if_block.m(div1, null);
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*name, image*/ 3 && t0_value !== (t0_value = (/*name*/ ctx[1] && !/*image*/ ctx[0]
    			? /*name*/ ctx[1].charAt(0).toUpperCase()
    			: '') + "")) set_data(t0, t0_value);

    			if (dirty & /*image, id*/ 5) {
    				set_style(div0, "background-image", /*image*/ ctx[0]
    				? `url(${/*image*/ ctx[0]})`
    				: getGradientById(/*id*/ ctx[2] || 0));
    			}

    			if (/*isOnline*/ ctx[5]) {
    				if (if_block) ; else {
    					if_block = create_if_block$1();
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*variant, size*/ 24 && div1_class_value !== (div1_class_value = "avatar avatar_variant_" + /*variant*/ ctx[4] + " avatar_size_" + /*size*/ ctx[3])) {
    				attr(div1, "class", div1_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (if_block) if_block.d();
    		}
    	};
    }

    exports.EAvatarShape = void 0;

    (function (EAvatarShape) {
    	EAvatarShape[EAvatarShape["circle"] = 0] = "circle";
    	EAvatarShape[EAvatarShape["squircle"] = 1] = "squircle";
    })(exports.EAvatarShape || (exports.EAvatarShape = {}));

    function instance$2($$self, $$props, $$invalidate) {
    	let { image = false } = $$props;
    	let { name } = $$props;
    	let { id } = $$props;
    	let { size = 1 } = $$props;
    	let { variant = exports.EAvatarShape.circle } = $$props;
    	let { isOnline = false } = $$props;

    	$$self.$$set = $$props => {
    		if ('image' in $$props) $$invalidate(0, image = $$props.image);
    		if ('name' in $$props) $$invalidate(1, name = $$props.name);
    		if ('id' in $$props) $$invalidate(2, id = $$props.id);
    		if ('size' in $$props) $$invalidate(3, size = $$props.size);
    		if ('variant' in $$props) $$invalidate(4, variant = $$props.variant);
    		if ('isOnline' in $$props) $$invalidate(5, isOnline = $$props.isOnline);
    	};

    	return [image, name, id, size, variant, isOnline];
    }

    class Avatar extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			image: 0,
    			name: 1,
    			id: 2,
    			size: 3,
    			variant: 4,
    			isOnline: 5
    		});
    	}
    }

    /* src/UI/components/Tooltip/Tooltip.svelte generated by Svelte v3.46.4 */

    function create_else_block(ctx) {
    	let div1;
    	let t;
    	let div0;
    	let div0_class_value;
    	let div1_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	return {
    		c() {
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			t = space();
    			div0 = element("div");
    			attr(div0, "class", div0_class_value = "tooltip tooltip_position_" + /*position*/ ctx[2] + " body2");
    			toggle_class(div0, "border", /*isBorder*/ ctx[5]);
    			attr(div1, "class", div1_class_value = "tooltip-wrapper " + /*classes*/ ctx[4]);
    			attr(div1, "style", /*style*/ ctx[3]);
    		},
    		m(target, anchor) {
    			insert(target, div1, anchor);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append(div1, t);
    			append(div1, div0);
    			div0.innerHTML = /*text*/ ctx[1];
    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[6],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*text*/ 2) div0.innerHTML = /*text*/ ctx[1];
    			if (!current || dirty & /*position*/ 4 && div0_class_value !== (div0_class_value = "tooltip tooltip_position_" + /*position*/ ctx[2] + " body2")) {
    				attr(div0, "class", div0_class_value);
    			}

    			if (dirty & /*position, isBorder*/ 36) {
    				toggle_class(div0, "border", /*isBorder*/ ctx[5]);
    			}

    			if (!current || dirty & /*classes*/ 16 && div1_class_value !== (div1_class_value = "tooltip-wrapper " + /*classes*/ ctx[4])) {
    				attr(div1, "class", div1_class_value);
    			}

    			if (!current || dirty & /*style*/ 8) {
    				attr(div1, "style", /*style*/ ctx[3]);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (detaching) detach(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (16:0) {#if isHidden}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	return {
    		c() {
    			if (default_slot) default_slot.c();
    		},
    		m(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[6],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[6])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isHidden*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach(if_block_anchor);
    		}
    	};
    }

    exports.ETooltipPosition = void 0;

    (function (ETooltipPosition) {
    	ETooltipPosition[ETooltipPosition["bottom"] = 0] = "bottom";
    	ETooltipPosition[ETooltipPosition["right"] = 1] = "right";
    })(exports.ETooltipPosition || (exports.ETooltipPosition = {}));

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	let { isHidden = false } = $$props;
    	let { text = '' } = $$props;
    	let { position = exports.ETooltipPosition.bottom } = $$props;
    	let { style = '' } = $$props;
    	let { classes = '' } = $$props;
    	let { isBorder = true } = $$props;

    	$$self.$$set = $$props => {
    		if ('isHidden' in $$props) $$invalidate(0, isHidden = $$props.isHidden);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    		if ('position' in $$props) $$invalidate(2, position = $$props.position);
    		if ('style' in $$props) $$invalidate(3, style = $$props.style);
    		if ('classes' in $$props) $$invalidate(4, classes = $$props.classes);
    		if ('isBorder' in $$props) $$invalidate(5, isBorder = $$props.isBorder);
    		if ('$$scope' in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	return [isHidden, text, position, style, classes, isBorder, $$scope, slots];
    }

    class Tooltip extends SvelteComponent {
    	constructor(options) {
    		super();

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			isHidden: 0,
    			text: 1,
    			position: 2,
    			style: 3,
    			classes: 4,
    			isBorder: 5
    		});
    	}
    }

    /* src/UI/components/Tabs/Tabs.svelte generated by Svelte v3.46.4 */

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (9:4) {#each tabs as tab, index}
    function create_each_block(ctx) {
    	let div;
    	let t0_value = /*tab*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let interactiveElement_action;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*index*/ ctx[7]);
    	}

    	return {
    		c() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr(div, "class", "tabs__item");

    			toggle_class(div, "rounded_light", /*isRounded*/ ctx[2] === undefined
    			? /*$_theme*/ ctx[3].isRounded
    			: /*isRounded*/ ctx[2]);

    			toggle_class(div, "active", /*active*/ ctx[0] === /*index*/ ctx[7]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);
    			append(div, t0);
    			append(div, t1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(interactiveElement_action = interactiveElement.call(null, div, {
    						isActive: /*$_theme*/ ctx[3].isInteractiveCursor && /*active*/ ctx[0] !== /*index*/ ctx[7]
    					})),
    					listen(div, "click", click_handler)
    				];

    				mounted = true;
    			}
    		},
    		p(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*tabs*/ 2 && t0_value !== (t0_value = /*tab*/ ctx[5] + "")) set_data(t0, t0_value);

    			if (interactiveElement_action && is_function(interactiveElement_action.update) && dirty & /*$_theme, active*/ 9) interactiveElement_action.update.call(null, {
    				isActive: /*$_theme*/ ctx[3].isInteractiveCursor && /*active*/ ctx[0] !== /*index*/ ctx[7]
    			});

    			if (dirty & /*isRounded, undefined, $_theme*/ 12) {
    				toggle_class(div, "rounded_light", /*isRounded*/ ctx[2] === undefined
    				? /*$_theme*/ ctx[3].isRounded
    				: /*isRounded*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 1) {
    				toggle_class(div, "active", /*active*/ ctx[0] === /*index*/ ctx[7]);
    			}
    		},
    		d(detaching) {
    			if (detaching) detach(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};
    }

    function create_fragment(ctx) {
    	let div;
    	let each_value = /*tabs*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr(div, "class", "tabs");

    			toggle_class(div, "rounded", /*isRounded*/ ctx[2] === undefined
    			? /*$_theme*/ ctx[3].isRounded
    			: /*isRounded*/ ctx[2]);
    		},
    		m(target, anchor) {
    			insert(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p(ctx, [dirty]) {
    			if (dirty & /*$_theme, active, isRounded, undefined, tabs*/ 15) {
    				each_value = /*tabs*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*isRounded, undefined, $_theme*/ 12) {
    				toggle_class(div, "rounded", /*isRounded*/ ctx[2] === undefined
    				? /*$_theme*/ ctx[3].isRounded
    				: /*isRounded*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d(detaching) {
    			if (detaching) detach(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let $_theme;
    	component_subscribe($$self, _theme, $$value => $$invalidate(3, $_theme = $$value));
    	let { tabs = [] } = $$props;
    	let { active = 0 } = $$props;
    	let { isRounded } = $$props;
    	const click_handler = index => $$invalidate(0, active = index);

    	$$self.$$set = $$props => {
    		if ('tabs' in $$props) $$invalidate(1, tabs = $$props.tabs);
    		if ('active' in $$props) $$invalidate(0, active = $$props.active);
    		if ('isRounded' in $$props) $$invalidate(2, isRounded = $$props.isRounded);
    	};

    	return [active, tabs, isRounded, $_theme, click_handler];
    }

    class Tabs extends SvelteComponent {
    	constructor(options) {
    		super();
    		init(this, options, instance, create_fragment, safe_not_equal, { tabs: 1, active: 0, isRounded: 2 });
    	}
    }

    exports.Avatar = Avatar;
    exports.Button = Button;
    exports.Checkbox = Checkbox;
    exports.Input = Input;
    exports.Loader = Loader;
    exports.Paper = Paper;
    exports.Switcher = Switcher;
    exports.Tabs = Tabs;
    exports.Tooltip = Tooltip;
    exports["default"] = actions;
    exports.interactiveElement = interactiveElement;
    exports.setCursor = setCursor;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({});
