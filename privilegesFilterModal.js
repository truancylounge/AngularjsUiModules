ccwgApp.controller('SaveNewFilterModalController', ['$scope', '$uibModalInstance', 'userService', 'selectedRoles', 'selectedServices', 'selectedEnvs', 'roles', 'services', 'envs', '$sessionStorage',
  function($scope, $uibModalInstance, userService, selectedRoles, selectedServices, selectedEnvs, roles, services, envs, $sessionStorage) {

    $scope.filterName;
    $scope.selectedRolesList = selectedRoles;
    $scope.selectedServicesList = selectedServices;
    $scope.selectedEnvList = selectedEnvs;
    $scope.defaultFlag;
    $scope.globalFlag;

    $scope.roles = roles;
    $scope.services = services;
    $scope.envs = envs;

    $scope.userFiltersJson = [];

    $scope.saveNewFilter = function() {

      var userId = $sessionStorage.user.name;

      $scope.userFiltersJson.push({
        "userId": userId, 
        "roleFilter": $scope.selectedRolesList.join(","), 
        "serviceFilter": $scope.selectedServicesList.join(","),
        "envFilter": $scope.selectedEnvList.join(",") === "" ? null : $scope.selectedEnvList.join(","),
        "filterName": $scope.filterName,
        "defaultFlag": $scope.defaultFlag,
        "globalFlag": $scope.globalFlag,
        "action": "I"
      });


      userService.postUserFilters($scope.userFiltersJson, userId)
        .then(
          function(response) {
            $uibModalInstance.close($scope.userFiltersJson[0]);
          },
          function(response) {
            $uibModalInstance.dismiss(response);
          }
        );
    };

    // This method is called when roles are selected on the modal
    $scope.selectedRoles = function(data) {
      $scope.selectedRolesList = data;
    };

    // This method is called when services are selected on the modal
    $scope.selectedServices = function(data) {
      $scope.selectedServicesList = data;
    };

    // This method is called when envs are selected on the modal
    $scope.selectedEnvs = function(data) {
      $scope.selectedEnvList = data;
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

}]);


ccwgApp.controller('DeleteFilterModalController', ['$scope', '$uibModalInstance', 'userService', 'userPrivilegeFilter', 'userFilterEntities', '$sessionStorage',
  function($scope, $uibModalInstance, userService, userPrivilegeFilter, userFilterEntities, $sessionStorage) {

    $scope.userPrivilegeFilter = userPrivilegeFilter;
    $scope.userFilterEntities = userFilterEntities;

    $scope.userFiltersJson = [];

    $scope.deleteFilter = function() {

      var userId = $sessionStorage.user.name;
      var deleteUserFilterEntity;

      $scope.userFilterEntities.some(function(userFilterEntity) {
        if(userFilterEntity.filterName == $scope.userPrivilegeFilter)
          deleteUserFilterEntity = userFilterEntity;
      });

      $scope.userFiltersJson.push(deleteUserFilterEntity);

      console.log($scope.userFiltersJson);


      userService.deleteUserFilters($scope.userFiltersJson, userId)
        .then(
          function(response) {
            $uibModalInstance.close();
          },
          function(response) {
            $uibModalInstance.dismiss(response);
          }
        );
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };
}]);


ccwgApp.controller('SaveFilterModalController', ['$scope', '$uibModalInstance', 'userService', 'selectedRoles', 'selectedServices', 'selectedEnvs', 'roles', 'services', 'envs', 'userPrivilegeFilter', 'userFilterEntities', '$sessionStorage',
  function($scope, $uibModalInstance, userService, selectedRoles, selectedServices, selectedEnvs, roles, services, envs, userPrivilegeFilter, userFilterEntities, $sessionStorage) {

    $scope.filterName = userPrivilegeFilter;
    $scope.defaultFlag;
    $scope.globalFlag;

    $scope.selectedRolesList = selectedRoles;
    $scope.selectedServicesList = selectedServices;
    $scope.selectedEnvList = selectedEnvs;

    $scope.roles = roles;
    $scope.services = services;
    $scope.envs = envs;

    $scope.userPrivilegeFilter = userPrivilegeFilter;
    $scope.userFilterEntities = userFilterEntities;
    
    $scope.userFilterEntities.some(function(userFilterEntity) {
        if(userFilterEntity.filterName == $scope.userPrivilegeFilter) {
          $scope.defaultFlag = userFilterEntity.defaultFlag;
          $scope.globalFlag = userFilterEntity.globalFlag;
        }          
    });


    $scope.userFiltersJson = [];

    $scope.saveFilter = function() {

      var userId = $sessionStorage.user.name;

      var saveUserFilterEntity;

      $scope.userFilterEntities.some(function(userFilterEntity) {
        if(userFilterEntity.filterName == $scope.userPrivilegeFilter)
          saveUserFilterEntity = userFilterEntity;
      });

      saveUserFilterEntity.roleFilter = $scope.selectedRolesList.join(",");
      saveUserFilterEntity.serviceFilter = $scope.selectedServicesList.join(",");
      saveUserFilterEntity.envFilter = $scope.selectedEnvList.join(",") === "" ? null : $scope.selectedEnvList.join(",");
      saveUserFilterEntity.defaultFlag = $scope.defaultFlag;
      saveUserFilterEntity.globalFlag = $scope.globalFlag;

      saveUserFilterEntity.action = "U";

      $scope.userFiltersJson.push(saveUserFilterEntity);

      userService.postUserFilters($scope.userFiltersJson, userId)
        .then(
          function(response) {
            $uibModalInstance.close($scope.userFiltersJson[0]);
          },
          function(response) {
            $uibModalInstance.dismiss(response);
          }
        );
    };

    // This method is called when roles are selected on the modal
    $scope.selectedRoles = function(data) {
      $scope.selectedRolesList = data;
    };

    // This method is called when services are selected on the modal
    $scope.selectedServices = function(data) {
      $scope.selectedServicesList = data;
    };

    // This method is called when envs are selected on the modal
    $scope.selectedEnvs = function(data) {
      $scope.selectedEnvList = data;
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

}]);