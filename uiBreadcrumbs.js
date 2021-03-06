/**
 * @file Angular UI-Bredcrumbs is an Angular 1 directive that auto-generates breadcrumbs from UI-Router routes.
 * @see {@link https://github.com/AdrianToman1/Angular-UI-Breadcrumbs}
 * @author Michael Bromley <michael@michaelbromley.co.uk>
 * @author Adrian Toman <adrian@adriantoman.com.au>
 * @copyright Original work Copyright 2014 Michael Bromley <michael@michaelbromley.co.uk>
 * @copyright Modified work Adrian Toman 2017
 * @license MIT
 */

(function() {

  /**
   * @ngdoc directive
   * @name ui.breadcrumbs.uiBreadcrumbs
   * @restrict E
   * @scope
   * @param {String=} displaynameProperty This is the parameter1 description. This is an optional parameter
   * @param {String=} abstractProxyProperty This is the parameter2 description. This is an optional parameter
   *
   * @description
   * Automatially generates breadcrumbs from UI-Router routes.
   *
   * @example
     <ui-breadcrumbs>
     </ui-breadcrumbs>
   */
  angular
    .module('ui.breadcrumbs', ['ui.router'])
    .directive('uiBreadcrumbs', uiBreadcrumbs);

  uiBreadcrumbs.$inject = ['$interpolate', '$state'];

  function uiBreadcrumbs($interpolate, $state) {
            return {
                restrict: 'E',
                template:
                    '<ol class="breadcrumb">' +
                      '<li ng-repeat="crumb in breadcrumbs" ' +
                          'ng-class="{ active: $last }"><a ui-sref="{{ crumb.route }}" ng-if="!$last">{{ crumb.displayName }}&nbsp;</a><span ng-show="$last">{{ crumb.displayName }}</span>' +
                      '</li>' +
                    '</ol>',
                scope: {
                    displaynameProperty: '@',
                    abstractProxyProperty: '@?'
                },
                link: function(scope) {
                    scope.breadcrumbs = [];
                    if ($state.$current.name !== '') {
                        updateBreadcrumbsArray();
                    }
                    scope.$on('$stateChangeSuccess', function() {
                        updateBreadcrumbsArray();
                    });
                    scope.$on('updateBreadcrumbsArray', function () {
                        updateBreadcrumbsArray();
                    });

                    /**
                     * @ngdoc method
                     * @name updateBreadcrumbsArray
                     * @methodOf ui.breadcrumbs.uiBreadcrumbs
                     * @description
                     * Start with the current state and traverse up the path to build the
                     * array of breadcrumbs that can be used in an ng-repeat in the template.
                     */
                    function updateBreadcrumbsArray() {
                        var workingState;
                        var displayName;
                        var breadcrumbs = [];
                        var currentState = $state.$current;

                        while(currentState && currentState.name !== '') {
                            workingState = getWorkingState(currentState);
                            if (workingState) {
                                displayName = getDisplayName(workingState);

                                if (displayName !== false && !stateAlreadyInBreadcrumbs(workingState, breadcrumbs)) {
                                    breadcrumbs.push({
                                        displayName: displayName,
                                        route: workingState.name
                                    });
                                }
                            }
                            currentState = currentState.parent;
                        }
                        breadcrumbs.reverse();
                        scope.breadcrumbs = breadcrumbs;
                    }

                    /**
                     * @ngdoc method
                     * @name getWorkingState
                     * @methodOf ui.breadcrumbs.uiBreadcrumbs
                     * @description
                     * Get the state to put in the breadcrumbs array, taking into account that if the current state is abstract,
                     * we need to either substitute it with the state named in the `scope.abstractProxyProperty` property, or
                     * set it to `false` which means this breadcrumb level will be skipped entirely.
                     * @param currentState
                     * @returns {*}
                     */
                    function getWorkingState(currentState) {
                        var proxyStateName;
                        var workingState = currentState;
                        if (currentState.abstract === true) {
                            if (typeof scope.abstractProxyProperty !== 'undefined') {
                                proxyStateName = getObjectValue(scope.abstractProxyProperty, currentState);
                                if (proxyStateName) {
                                    workingState = angular.copy($state.get(proxyStateName));
                                    if (workingState) {
                                        workingState.locals = currentState.locals;
                                    }
                                } else {
                                    workingState = false;
                                }
                            } else {
                                workingState = false;
                            }
                        }
                        return workingState;
                    }

                    /**
                     * @ngdoc method
                     * @name getDisplayName
                     * @methodOf ui.breadcrumbs.uiBreadcrumbs
                     * @description
                     * Resolve the displayName of the specified state. Take the property specified by the `displayname-property`
                     * attribute and look up the corresponding property on the state's config object. The specified string can be interpolated against any resolved
                     * properties on the state config object, by using the usual {{ }} syntax.
                     * @param currentState
                     * @returns {*}
                     */
                    function getDisplayName(currentState) {
                        var interpolationContext;
                        var propertyReference;
                        var displayName;

                        if (!scope.displaynameProperty) {
                            // if the displayname-property attribute was not specified, default to the state's name
                            return currentState.name;
                        }
                        propertyReference = getObjectValue(scope.displaynameProperty, currentState);

                        if (propertyReference === false) {
                            return false;
                        } else if (typeof propertyReference === 'undefined') {
                            return currentState.name;
                        } else {
                            // use the $interpolate service to handle any bindings in the propertyReference string.
                            interpolationContext =  (typeof currentState.locals !== 'undefined') ? currentState.locals.globals : currentState;
                            displayName = $interpolate(propertyReference)(interpolationContext);
                            return displayName;
                        }
                    }

                    /**
                     * @ngdoc method
                     * @name getObjectValue
                     * @methodOf ui.breadcrumbs.uiBreadcrumbs
                     * @description
                     * Given a string of the type 'object.property.property', traverse the given context (eg the current $state object) and return the
                     * value found at that path.
                     *
                     * @param objectPath
                     * @param currentState
                     * @returns {*}
                     */
                    function getObjectValue(objectPath, currentState) {
                        var propertyArray = objectPath.split('.');
                        var propertyReference = currentState;

                        for (var i = 0, len = propertyArray.length; i < len; i ++) {
                            if (angular.isDefined(propertyReference[propertyArray[i]])) {
                                propertyReference = propertyReference[propertyArray[i]];
                            } else {
                                // if the specified property was not found, default to the state's name
                                return undefined;
                            }
                        }
                        return propertyReference;
                    }

                    /**
                     * @ngdoc method
                     * @name stateAlreadyInBreadcrumbs
                     * @methodOf ui.breadcrumbs.uiBreadcrumbs
                     * @description
                     * Check whether the current `state` has already appeared in the current breadcrumbs array. This check is necessary
                     * when using abstract states that might specify a proxy that is already there in the breadcrumbs.
                     * @param state
                     * @param breadcrumbs
                     * @returns {boolean}
                     */
                     function stateAlreadyInBreadcrumbs(state, breadcrumbs) {
                         for(var i = 0, len = breadcrumbs.length; i < len;i++) {
                             if (breadcrumbs[i].route === state.name) {
                                 return true;
                             }
                         }
                         return false;
                     }
                }
            };
        }

})();
