IonicModule

.controller('$ionNavBar', [
  '$scope',
  '$element',
  '$attrs',
  '$compile',
  '$animate',
  '$timeout',
  '$ionicHistory',
  '$ionicNavBarDelegate',
  '$ionicConfig',
function($scope, $element, $attrs, $compile, $animate, $timeout, $ionicHistory, $ionicNavBarDelegate, $ionicConfig) {

  var CSS_HIDE = 'hide';
  var DATA_NAV_BAR_CTRL = '$ionNavBarController';
  var PRIMARY_BUTTONS = 'primaryButtons';
  var SECONDARY_BUTTONS = 'secondaryButtons';
  var BACK_BUTTON = 'backButton';

  var self = this;
  var headerBars = [];
  var navElementHtml = {};
  var titleText = '';
  var previousTitleText;
  var isShown;
  var navBarConfig = $ionicConfig.navBar;

  $element.parent().data(DATA_NAV_BAR_CTRL, self);

  var deregisterInstance = $ionicNavBarDelegate._registerInstance(this, $attrs.delegateHandle);


  self.init = function() {
    // create two nav bar blocks which will trade out which one is shown
    self.createHeaderBar(false, 'bar-positive');
    self.createHeaderBar(true, 'bar-assertive');
  };


  self.createHeaderBar = function(isActive, navBarClass) {
    var containerEle = jqLite( '<div class="nav-bar-block">' );
    if (isActive) {
      containerEle.addClass('nav-bar-block-active');
    }
    var headerBarEle = jqLite( '<ion-header-bar>' ).addClass($attrs.class).addClass(navBarClass);
    var titleEle = jqLite('<div class="title">');
    var navEle = {};
    var lastViewBtnsEle = {};
    var leftButtonsEle, rightButtonsEle;

    //navEle[BACK_BUTTON] = self.createBackButtonElement(headerBarEle);
    navEle[BACK_BUTTON] = createNavElement(BACK_BUTTON);
    navEle[BACK_BUTTON] && headerBarEle.append(navEle[BACK_BUTTON]);

    // append title in the header, this is the rock to where buttons append
    headerBarEle.append(titleEle);

    // create default button elements
    navEle[PRIMARY_BUTTONS] = createNavElement(PRIMARY_BUTTONS);
    navEle[SECONDARY_BUTTONS] = createNavElement(SECONDARY_BUTTONS);

    // append and position buttons
    positionButtons(navEle[PRIMARY_BUTTONS], PRIMARY_BUTTONS, true && !isActive);
    positionButtons(navEle[SECONDARY_BUTTONS], SECONDARY_BUTTONS, true && !isActive);

    // compile header and append to the DOM
    containerEle.append(headerBarEle);
    $element.append( $compile(containerEle)($scope.$new()) );

    var headerBarCtrl = headerBarEle.data('$ionHeaderBarController');

    var headerBarInstance = {
      isActive: isActive,
      showBack: function(shouldShow) {
        headerBarCtrl.showBack(shouldShow);
      },
      title: function(newTitleText) {
        headerBarCtrl.title(newTitleText);
      },
      setButtons: function(viewBtnsEle, side) {
        // first make sure any exiting view buttons have been removed
        headerBarInstance.removeButtons(side);

        if (viewBtnsEle) {
          // there's a view button for this side
          positionButtons(viewBtnsEle, side);

          // make sure the default button on this side is hidden
          if (navEle[side]) {
            navEle[side].addClass(CSS_HIDE);
          }
          lastViewBtnsEle[side] = viewBtnsEle;

        } else if (navEle[side]) {
          // there's a default button for this side and no view button
          navEle[side].removeClass(CSS_HIDE);
        }
      },
      removeButtons: function(side) {
        if (lastViewBtnsEle[side]) {
          lastViewBtnsEle[side].scope().$destroy();
          lastViewBtnsEle[side].remove();
          lastViewBtnsEle[side] = null;
        }
      },
      containerEle: function() {
        return containerEle;
      },
      headerBarEle: function() {
        return headerBarEle;
      },
      primaryButtonsEle: function() {
        return navEle[PRIMARY_BUTTONS];
      },
      secondaryButtonsEle: function() {
        return navEle[SECONDARY_BUTTONS];
      },
      backButtonEle: function() {
        return navEle[BACK_BUTTON];
      },
      afterLeave: function() {
        headerBarInstance.removeButtons(PRIMARY_BUTTONS);
        headerBarInstance.removeButtons(SECONDARY_BUTTONS);
        headerBarCtrl.resetBackButton();
      },
      controller: function() {
        return headerBarCtrl;
      },
      destroy: function() {
        headerBarInstance.removeButtons(PRIMARY_BUTTONS);
        headerBarInstance.removeButtons(SECONDARY_BUTTONS);
        headerBarCtrl.removeData();
        headerBarCtrl.destroy();
        containerEle.scope().$destroy();
        containerEle = headerBarEle = titleEle = leftButtonsEle = rightButtonsEle = navEle[PRIMARY_BUTTONS] = navEle[SECONDARY_BUTTONS] = navEle[BACK_BUTTON] = null;
      },
      id: Math.random()
    };

    function positionButtons(btnsEle, buttonType, isInitialLoad) {
      if (!btnsEle) return;

      var appendToRight = (buttonType == SECONDARY_BUTTONS && navBarConfig.positionSecondaryButtons() != 'left') ||
                          (buttonType == PRIMARY_BUTTONS && navBarConfig.positionPrimaryButtons() == 'right');

      if (appendToRight) {
        // right side
        if (!rightButtonsEle) {
          rightButtonsEle = jqLite('<div class="buttons buttons-b">');
          if (isInitialLoad) {
            rightButtonsEle.css('opacity', 0);
          }
          headerBarEle.append(rightButtonsEle);
        }
        if (buttonType == SECONDARY_BUTTONS) {
          rightButtonsEle.append(btnsEle);
        } else {
          rightButtonsEle.prepend(btnsEle);
        }

      } else {
        // left side
        if (!leftButtonsEle) {
          leftButtonsEle = jqLite('<div class="buttons buttons-a">');
          if (isInitialLoad) {
            leftButtonsEle.css('opacity', 0);
          }
          if (navEle[BACK_BUTTON]) {
            navEle[BACK_BUTTON].after(leftButtonsEle);
          } else {
            headerBarEle.prepend(leftButtonsEle);
          }
        }
        if (buttonType == SECONDARY_BUTTONS) {
          leftButtonsEle.append(btnsEle);
        } else {
          leftButtonsEle.prepend(btnsEle);
        }
      }

    }

    headerBars.push(headerBarInstance);

    return headerBarInstance;
  };


  self.navElement = function(type, html) {
    if ( isDefined(html) ) {
      navElementHtml[type] = html;
    }
    return navElementHtml[type];
  };


  self.updateNavBar = function(viewData) {
    self.enable();
    var enteringHeaderBar = self.isInitialized ? getOffScreenHeaderBar() : getOnScreenHeaderBar();
    var leavingHeaderBar = self.isInitialized ? getOnScreenHeaderBar() : null;

    // update if the entering header should show the back button or not
    self.showBackButton(viewData.showBack, enteringHeaderBar);

    // update the entering header bar's title
    self.title(viewData.title, enteringHeaderBar);

    // update the buttons, depending if the view has their own or not
    enteringHeaderBar.setButtons(viewData.primaryButtons, PRIMARY_BUTTONS);
    enteringHeaderBar.setButtons(viewData.secondaryButtons, SECONDARY_BUTTONS);

    // begin transition of entering and leaving header bars
    self.transition(enteringHeaderBar, leavingHeaderBar, viewData);

    self.isInitialized = true;
  };


  self.transition = function(enteringHeaderBar, leavingHeaderBar, viewData) {

    var aniScript = {

      entering: {
        forward: {
          title: {
            from: {
              opacity: 0,
              x: 'right'
            },
            to: {
              opacity: 1,
              x: 'center'
            }
          },
          buttons: {
            from: {
              opacity: 0,
            },
            to: {
              opacity: 1,
            }
          },
        },
        back: {
          title: {
            from: {
              opacity: 0,
              x: 'left'
            },
            to: {
              opacity: 1,
              x: 'center'
            }
          },
          buttons: {
            from: {
              opacity: 0,
            },
            to: {
              opacity: 1,
            }
          },
        }
      },

      leaving: {
        forward: {
          title: {
            from: {
              opacity: 1,
              x: 'center'
            },
            to: {
              opacity: 0,
              x: 'left'
            }
          },
          buttons: {
            from: {
              opacity: 1,
            },
            to: {
              opacity: 0,
            }
          },
        },
        back: {
          title: {
            from: {
              opacity: 1,
              x: 'center'
            },
            to: {
              opacity: 0,
              x: 'right'
            }
          },
          buttons: {
            from: {
              opacity: 1,
            },
            to: {
              opacity: 0,
            }
          },
        },
      }

    };


    var enteringHeaderBarCtrl = enteringHeaderBar.controller();
    enteringHeaderBarCtrl.resetBackButton();

    var startEnterTransition, startLeaveTransition;
    var animation = $ionicConfig.navBar.transitionScript(aniScript);

    if (animation) {
      startEnterTransition = enteringHeaderBarCtrl.transition( animation.entering[viewData.direction] );
      if (leavingHeaderBar) {
        startLeaveTransition = leavingHeaderBar.controller().transition( animation.leaving[viewData.direction] );
      }
    }

    $timeout(function() {
      enteringHeaderBarCtrl.alignTitle().then(function(){
        startEnterTransition && startEnterTransition();
        startLeaveTransition && startLeaveTransition();

        for (var x=0; x<headerBars.length; x++) {
          headerBars[x].isActive = false;
        }
        enteringHeaderBar.isActive = true;

        enteringHeaderBar.containerEle().addClass('nav-bar-block-active');
        leavingHeaderBar && leavingHeaderBar.containerEle().removeClass('nav-bar-block-active');
      });
    }, 16);

  };


  self.showBar = function(show) {
    if (show && !isShown) {
      $element.removeClass(CSS_HIDE);
    } else if (!show && isShown) {
      $element.addClass(CSS_HIDE);
    }
    $scope.$parent.$hasHeader = !!show;
    isShown = show;
  };


  self.showBackButton = function(show, headerBar) {
    headerBar = headerBar || getOnScreenHeaderBar();
    headerBar && headerBar.showBack(show);
  };


  self.title = function(newTitleText, headerBar) {
    if (arguments.length) {
      newTitleText = newTitleText || '';
      headerBar = headerBar || getOnScreenHeaderBar();
      headerBar && headerBar.title(newTitleText);
      previousTitleText = titleText;
      titleText = newTitleText;
    }
    return titleText;
  };


  self.enable = function() {
    // set primary to show first
    self.showBar(true);

    // set non primary to hide second
    for (var x=0; x<$ionicNavBarDelegate._instances.length; x++) {
      if ($ionicNavBarDelegate._instances[x] !== self) $ionicNavBarDelegate._instances[x].showBar(false);
    }
  };


  function createNavElement(type) {
    if ( navElementHtml[type] ) {
      return jqLite(navElementHtml[type]);
    }
  }


  function getOnScreenHeaderBar() {
    for (var x=0; x<headerBars.length; x++) {
      if (headerBars[x].isActive) return headerBars[x];
    }
  }


  function getOffScreenHeaderBar() {
    for (var x=0; x<headerBars.length; x++) {
      if (!headerBars[x].isActive) return headerBars[x];
    }
  }


  $scope.$goBack = self.back = function() {
    var backView = $ionicHistory.backView();
    backView && backView.go();
  };


  $scope.$on('$destroy', function(){
    $scope.$parent.$hasHeader = false;
    $element.parent().removeData(DATA_NAV_BAR_CTRL);
    for (var x=0; x<headerBars.length; x++) {
      headerBars[x].destroy();
    }
    headerBars = null;
    deregisterInstance();
  });

}]);

