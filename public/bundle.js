
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
  'use strict';

  function _arrayLikeToArray(r, a) {
    (null == a || a > r.length) && (a = r.length);
    for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
    return n;
  }
  function _arrayWithHoles(r) {
    if (Array.isArray(r)) return r;
  }
  function _iterableToArrayLimit(r, l) {
    var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
    if (null != t) {
      var e,
        n,
        i,
        u,
        a = [],
        f = !0,
        o = !1;
      try {
        if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
      } catch (r) {
        o = !0, n = r;
      } finally {
        try {
          if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
        } finally {
          if (o) throw n;
        }
      }
      return a;
    }
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }
  function _slicedToArray(r, e) {
    return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
  }
  function _unsupportedIterableToArray(r, a) {
    if (r) {
      if ("string" == typeof r) return _arrayLikeToArray(r, a);
      var t = {}.toString.call(r).slice(8, -1);
      return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
    }
  }

  let nextUnitOfWork = null; // 工作单元
  let currentRoot = null; // previous fiber tree root
  let wipRoot = null;
  let deletions = null; // 更新时需要删除旧 fiber array
  let wipFiber = null;
  let hookIndex = null;
  const isEvent = (key) => key.startsWith('on');
  const isProperty = (key) => key !== 'children' && !isEvent(key);
  const isNew = (prev, next) => key => prev[key] !== next[key];
  const isGone = (prev, next) => key => !(key in next);
  const createElement = (type, props, ...children) => {
      return {
          type,
          props: Object.assign(Object.assign({}, props), { children: children.map(child => (typeof child === 'object'
                  ? child
                  : createTextElement(child))) }),
      };
  };
  const createTextElement = (text) => {
      return {
          type: 'TEXT_ELEMENT',
          props: {
              nodeValue: text,
              children: [],
          },
      };
  };
  // 构建 fiber tree 时创建的 dom
  const createDom = (fiber) => {
      const dom = fiber.type === 'TEXT_ELEMENT'
          ? document.createTextNode('')
          : document.createElement(fiber.type);
      updateDom(dom, {}, fiber.props);
      return dom;
  };
  // (update dom)core
  function updateDom(dom, prevProps, nextProps) {
      // remove old or changed event listener
      Object.keys(prevProps)
          .filter(isEvent)
          .filter(key => !(key in nextProps) || isNew(prevProps, nextProps)(key))
          .forEach(name => {
          const eventType = name.toLowerCase().substring(2);
          dom.removeEventListener(eventType, prevProps[name]);
      });
      // add event listener
      Object.keys(nextProps)
          .filter(isEvent)
          .filter(isNew(prevProps, nextProps))
          .forEach(name => {
          const eventType = name.toLowerCase().substring(2);
          dom.addEventListener(eventType, nextProps[name]);
      });
      // remove old properties
      Object.keys(prevProps)
          .filter(isProperty)
          .filter(isGone(prevProps, nextProps))
          .forEach(name => {
          dom[name] = '';
      });
      // set new or changed properties
      Object.keys(nextProps)
          .filter(isProperty)
          .filter(isNew(prevProps, nextProps))
          .forEach(name => {
          dom[name] = nextProps[name];
      });
  }
  // 删除节点
  function commitDeletion(fiber, domParent) {
      if (fiber.dom) {
          domParent.removeChild(fiber.dom);
      }
      else {
          commitDeletion(fiber.child, domParent);
      }
  }
  // (fiber tree => dom)core
  function commitWork(fiber) {
      if (!fiber) {
          return;
      }
      let domParentFiber = fiber.parent;
      while (!domParentFiber.dom) {
          domParentFiber = domParentFiber.parent;
      }
      const domParent = domParentFiber.dom;
      if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
          domParent.appendChild(fiber.dom);
      }
      else if (fiber.effectTag === 'UPDATE' && fiber.dom != null) {
          updateDom(fiber.dom, fiber.alternate.props, fiber.props);
      }
      else if (fiber.effectTag === 'DELETION') {
          commitDeletion(fiber.child, domParent);
      }
      commitWork(fiber.child);
      commitWork(fiber.sibling);
  }
  // 根据 fiber tree 创建 dom 链接(类组件) & 存储 old fiber tree 用于下一次 compare
  function commitRoot() {
      // TODO add nodes to dom
      deletions.forEach(commitWork);
      commitWork(wipRoot.child);
      currentRoot = wipRoot;
      wipRoot = null;
  }
  // fiber compare
  function reconcileChildren(wipFiber, elements) {
      let index = 0;
      let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
      let prevSibling = null;
      while (index < elements.length || oldFiber != null) {
          const element = elements[index];
          let newFiber = null;
          // TODO compare oldFiber to element(current node)
          const sameType = oldFiber && element && element.type === oldFiber.type;
          if (sameType) {
              // TODO just update node props
              newFiber = {
                  type: oldFiber.type,
                  props: element.props,
                  dom: oldFiber.dom,
                  parent: wipFiber,
                  alternate: oldFiber,
                  effectTag: 'UPDATE',
              };
          }
          if (element && !sameType) {
              // TODO add this node
              newFiber = {
                  type: element.type,
                  props: element.props,
                  dom: null,
                  parent: wipFiber,
                  alternate: null,
                  effectTag: 'PLACEMENT',
              };
          }
          if (oldFiber && !sameType) {
              // TODO delete the oldFiber's node
              oldFiber.effectTag = 'DELETION';
              deletions.push(oldFiber);
          }
          if (oldFiber) {
              oldFiber = oldFiber.sibling;
          }
          if (index === 0) {
              wipFiber.child = newFiber;
          }
          else {
              prevSibling.sibling = newFiber;
          }
          prevSibling = newFiber;
          index++;
      }
  }
  // 创建函数组件 fiber
  function updateFunctionComponent(fiber) {
      wipFiber = fiber;
      hookIndex = 0;
      wipFiber.hooks = [];
      const children = [fiber.type(fiber.props)];
      reconcileChildren(fiber, children);
  }
  function useState(initial) {
      const oldHook = wipFiber.alternate && wipFiber.alternate.hooks && wipFiber.alternate.hooks[hookIndex];
      const hook = {
          state: oldHook ? oldHook.state : initial,
          queue: [],
      };
      const actions = oldHook ? oldHook.queue : [];
      actions.forEach(action => {
          hook.state = action(hook.state);
      });
      const setState = action => {
          hook.queue.push(action);
          wipRoot = {
              dom: currentRoot.dom,
              props: currentRoot.props,
              alternate: currentRoot,
          };
          nextUnitOfWork = wipRoot;
          deletions = [];
      };
      wipFiber.hooks.push(hook);
      hookIndex++;
      return [hook.state, setState];
  }
  // 创建类组件 fiber
  function updateHostComponent(fiber) {
      if (!fiber.dom) {
          fiber.dom = createDom(fiber);
      }
      reconcileChildren(fiber, fiber.props.children);
  }
  // 构建 fiber tree
  function performUnitOfWork(fiber) {
      // TODO create new fiber
      const isFunctionComponent = fiber.type instanceof Function;
      if (isFunctionComponent) {
          updateFunctionComponent(fiber);
      }
      else {
          updateHostComponent(fiber);
      }
      // TODO return next unit of work
      if (fiber.child) {
          return fiber.child;
      }
      let nextFiber = fiber;
      while (nextFiber) {
          if (fiber.sibling) {
              return nextFiber.sibling;
          }
          nextFiber = nextFiber.parent;
      }
  }
  const workLoop = (deadLine) => {
      let shouldYield = false;
      while (nextUnitOfWork && !shouldYield) {
          nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
          shouldYield = deadLine.timeRemaining() < 1;
      }
      if (!nextUnitOfWork && wipRoot) {
          commitRoot();
      }
      requestIdleCallback(workLoop);
  };
  // 浏览空闲时执行工作单元
  requestIdleCallback(workLoop);
  const render = (element, container) => {
      // TODO set next unit of work
      wipRoot = {
          dom: container,
          props: {
              children: [element],
          },
          alternate: currentRoot,
      };
      deletions = [];
      nextUnitOfWork = wipRoot;
  };
  class Reva {
  }
  Reva.createElement = createElement;
  Reva.render = render;
  Reva.useState = useState;
  // jsx => js
  // ```javascript
  // function App(props) {
  //     return Reva.createElement(
  //         'h1',
  //         null,
  //         'Hi ',
  //         props.name,
  //     );
  // }
  // const element = Reva.createElement(App, {
  //     name: 'foo',
  // });
  // ```
  // /** @jsx Reva.createElement */
  // function Counter(props) {
  //     const [state, setState] = Reva.useState(1);
  //     return (
  //         <h1 onClick={() => setState(c => c + 1)}>
  //             Count: {state}
  //         </h1>
  //     );
  // }
  // const element = <Counter />;
  // const container = document.getElementById('root');
  // Reva.render(element, container);
  window.Reva = Reva;

  function Counter(props) {
    var _Reva$useState = Reva.useState(1),
      _Reva$useState2 = _slicedToArray(_Reva$useState, 2),
      state = _Reva$useState2[0],
      setState = _Reva$useState2[1];
    return Reva.createElement("h1", {
      onclick: function onclick() {
        return setState(function (c) {
          return c + 1;
        });
      },
      style: 'user-select: none;'
    }, "Count: ", state);
  }
  var element = Reva.createElement(Counter, null);
  var container = document.getElementById('root');
  Reva.render(element, container);

})();
