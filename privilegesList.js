ccwgApp.controller('PrivilegeListController', ['$scope', '$uibModal', 'envService', 'privilegeService', 'lookupService', 'roleService', 'serviceRest', 'userService', '$sessionStorage',
        function($scope, $uibModal, envService, privilegeService, lookupService, roleService, serviceRest, userService, $sessionStorage) {

  $scope.privileges = [];
  $scope.entries = [];
  $scope.pristineEntries = [];
  $scope.entriesCount = 0;

  $scope.showSidebar = true;
  $scope.filterText = "Hide Filter";
  $scope.sidebarToggle = function() {
      $scope.showSidebar = !$scope.showSidebar;
      $scope.filterText = $scope.filterText === 'Hide Filter' ? 'Show Filter' : 'Hide Filter';
  }

  // The role Entities are used to retrive the roleId during createPrivilege()
  $scope.roleEntities = [];
  $scope.serviceEntities = [];
  $scope.serviceApiActionEntities = [];
  $scope.serviceApiActionsLoaded = false;

  // User privilege filter entities
  $scope.userFilterEntities = [];
  // List of filter names
  $scope.userPrivilegeFilters = [];
  // Currently selected filter name
  $scope.userPrivilegeFilter;

  // The 3 objects below are used to call methods on the magicSelect directive 
  $scope.msRolesFunction = {};
  $scope.msServicesFunction = {};
  $scope.msEnvsFunction = {};

  // Pagination attributes
  $scope.currentPage = envService.read('currentPage');
  $scope.itemsPerPage = envService.read('itemsPerPage');
  $scope.maxSize = envService.read('maxSize');

  $scope.policies = [];
  $scope.policyEditDisable = true;

  $scope.showDirtyRecordsOnly = 'off'; // Initially show all the records, if this flag changes only show dirty records

  // Attributes for filters
  $scope.services = [];
  $scope.roles = [];
  $scope.envs = [];
  $scope.selectedRolesList = [];
  $scope.selectedServicesList = []; 
  $scope.selectedEnvList = [];
  $scope.rolesLoaded = false;
  $scope.servicesLoaded = false;
  $scope.envsLoaded = false;
  // Roles to filter the privs table
  $scope.tableRolesList = [];


  // Back end pagination params
  $scope.privilegesCount;
  $scope.maxPageNumber;
  $scope.paginatedPageSize = 1000;

  //Setting for ng-dropdown-multiselect directive
  $scope.multiSelectSettings = {
      //closeOnSelect: true,
      //closeOnDeselect: true,
      scrollableHeight: '300px',
      scrollable: true,
      externalIdProp: ''
  };

  // Column Role filter attributes
  $scope.selectedPolicies = {}; 
  $scope.policyData = [ {id: 1, label: 'Allow'}, {id: 2, label: 'Deny'}];  

  $scope.dropdownFilterEvents = {
    onItemSelect: function(item, role) {
      //console.log(role);
      //console.log($scope.selectedPolicies);
    },
    onItemDeselect: function(item, role) {
      //console.log(role);
      //console.log($scope.selectedPolicies);
    },
    onInitDone: function(role) {
      // Initialize selected policies modal for each role that exist in $scope.tableRolesList
      /*
      $scope.tableRolesList.forEach(function(role) {
        $scope.selectedPolicies[role] = [];
      });
      */
      $scope.selectedPolicies[role] = []; // Rather than using $scope.tableRolesList, its easier to pass role to the directive and retrieve it on events.
    }

  };

  // Display Save & Delete buttons if filter isn't default or global
  $scope.canUserEditFilter = true;

  $scope.$watch(function() {return $sessionStorage.user.currentPermission}, function() {
    if($sessionStorage.user.currentPermission == 'Admin') {
      $scope.canUserEditFilter = true;      
    }
    else {
      $scope.canUserEditFilter = false;
    }
  } );

  $scope.isCurrentUserAdmin = function() {
    return $sessionStorage.user.currentPermission == 'Admin';
  }

  // Column Service filter attributes
  $scope.selectedTableServices = [];   
  $scope.servicesData = [];     // Data that gets displayed on Column Service Filter
  // Column ServiceApi Action filter attributes
  $scope.selectedTableActionGs = [];   
  $scope.serviceApiActionsData = [];     // Data that gets displayed on Column Service Api Action Filter
  // Column Envs filter attributes
  $scope.selectedTableEnvs = [];   
  $scope.envsData = [];     // Data that gets displayed on Column Envs Filter

/*
  $scope.serviceFilter = function (i) {
    if($scope.selectedServicesList.indexOf(i.serviceNameShort) != -1 ) {
      return i;
    }      
  };  


  $scope.envFilter = function (i) {
    if($scope.selectedEnvList.indexOf(i.environment) != -1 ) {
      return i;
    }      
  };  
*/ 

  $scope.getRoleId = function(roleName) {
    console.log("Entering roleId");
    var id;
    // return roleId for a given roleName
    $scope.roleEntities.some(function(roleEntity) {
      console.log(roleEntity);
      if(roleEntity.roleName === roleName)
        id = roleEntity.id;
    });

    return id;
  }

  $scope.dirtyRecordFilter = function(i) {
    switch($scope.showDirtyRecordsOnly) {
        case 'off':
          return i;
        case 'on':
          return i.action == 'U';
      }

  };

/** Column Filter Code Start*/
  // Individula Role Filters in the table
  $scope.columnRoleFilter = function(i) {
    var roleColumnFilter = [];
    // Create a list of filter object roleName and policy
    for(var property in $scope.selectedPolicies) {
      if($scope.selectedPolicies.hasOwnProperty(property)) {
        if($scope.selectedPolicies[property].length > 0) {
          var rolePolicies = [];
          $scope.selectedPolicies[property].forEach(function (value) {
            if(value.id == 1)
              rolePolicies.push("Allow");
            else if(value.id == 2)
              rolePolicies.push("Deny");
          });

          roleColumnFilter.push({
            roleName: property,
            policies: rolePolicies
          });

        }
      }
    };

    var filterSatisfied = true;

    if(roleColumnFilter.length > 0) {
      roleColumnFilter.forEach(function(roleFilter) {
        // If the policy doesnt exist discard the entry
        if($.inArray(i[roleFilter.roleName].approvedValue, roleFilter.policies) === -1 ) {
          filterSatisfied = false;
        }          
      });
    };

    if(filterSatisfied) {
      return i;
    }
  }; 

  $scope.columnServiceFilter = function(i) {
    var serviceNames = [];
    var doesEntrySatisfyCriteria = true;

    if($scope.selectedTableServices.length > 0) {
      $scope.selectedTableServices.forEach(function(selectedEntry) {
        serviceNames.push(selectedEntry.label);
      });

      if($.inArray(i.serviceNameShort, serviceNames) === -1)
        doesEntrySatisfyCriteria = false;
    }

    if(doesEntrySatisfyCriteria)
      return i;    
  };

  $scope.columnServiceApiActionFilter = function(i) {
    var serviceApiActionNames = [];
    var doesEntrySatisfyCriteria = true;

    if($scope.selectedTableActionGs.length > 0) {
      $scope.selectedTableActionGs.forEach(function(selectedEntry) {
        serviceApiActionNames.push(selectedEntry.label);
      });

      if($.inArray(i.apiActionName, serviceApiActionNames) === -1)
        doesEntrySatisfyCriteria = false;
    }

    if(doesEntrySatisfyCriteria)
      return i;    
  };

  $scope.columnEnvFilter = function(i) {
    var envNames = [];
    var doesEntrySatisfyCriteria = true;

    if($scope.selectedTableEnvs.length > 0) {
      $scope.selectedTableEnvs.forEach(function(selectedEntry) {
        envNames.push(selectedEntry.label);
      });

      if($.inArray(i.environment, envNames) === -1)
        doesEntrySatisfyCriteria = false;
    }

    if(doesEntrySatisfyCriteria)
      return i;    
  };

  /** Column Filter Code End*/    

  $scope.revertPrivileges = function() {
    $scope.runPrivilegeFilter(); 
  };

  $scope.isEditDisabled = function(i, role) {
    // If we aren't in edit mode, disable edits for all
    if($scope.policyEditDisable) {
      return $scope.policyEditDisable;
    }
/*
    if(i[role] === undefined) {
      return false;
    };
*/      
    // Here we are in edit mode but we cannot edit roles that have a proposed Value as they cannot be changed
    if(i[role].proposedValue) {
      return true; // edit's are disabled
    }

    // If none of the others qualify return  
    return $scope.policyEditDisable;
    
  }

  $scope.editPrivileges = function() {
    $scope.policyEditDisable = !$scope.policyEditDisable;
  };

  $scope.editPolicy = function(i, role) {
    console.log(i);

    // Retrieve the pristineEntry for the currently changed entry
    var pristineEntry;
    $scope.pristineEntries.some(function(entry) {
      if(entry.id === i.id) {
        pristineEntry = entry;
      }
    });

    // Role has never existed in privilege entries so a new role has been created
    if(!pristineEntry.hasOwnProperty(role)) {
      i[role].action = "U";
      i[role].roleId = $scope.getRoleId(role);
      i.action = "U";
    } else { // Role defined      
      // Check if pristineEntry has different policy for the current role, if it does then set action to be "U" on both role and entry
      if(i[role].approvedValue != pristineEntry[role].approvedValue) {
        i[role].action = "U";
        i[role].actualApprovedValue = pristineEntry[role].approvedValue;
      } else {
        delete i[role].action;
      }
    }
    // If any of the roles have been modified then set the privilege entry to be modified else set it to be un modified
    i.action = "I";
    $scope.tableRolesList.some(function(role) {
      if(i.hasOwnProperty(role) && i[role].action == "U") {
        i.action = "U";
      }
    });
  }; 

  $scope.checkSaveRevertValidity = function() {
    // Looping through entries to find out if any have been updated, if so enable Revert and Save buttons.
    var enable = false;
    if(typeof $scope.entries != 'undefined' && $scope.entries instanceof Array) {
      $scope.entries.filter(Boolean).forEach(function(entry) {
        if(entry.action == 'U') {
          enable = true;
        };
      });
    };
    return enable;
  };  

  $scope.createColumnTableFilter = function() {

    // Setting serviceData array for service column table filter
    if($scope.selectedServicesList.length === 0 ) {
      $scope.serviceEntities.forEach(function(serviceEntity) {
        $scope.servicesData.push({
          id: serviceEntity.id,
          label: serviceEntity.serviceNameShort
        });
      });

    } else {
      var serviceId = 1;
      $scope.selectedServicesList.forEach(function(service) {
        $scope.servicesData.push({
          id: serviceId++,
          label: service
        });
      });

    };


    // Setting serviceApiActionData array for service Api Action column table filter
    if($scope.selectedServicesList.length === 0 ) {
      $scope.serviceApiActionEntities.forEach(function(serviceApiActionEntity) {
        $scope.serviceApiActionsData.push({
          id: serviceApiActionEntity.id,
          label: serviceApiActionEntity.apiActionName
        });
      });

    } else {
      $scope.selectedServicesList.forEach(function(service) {
        // Iterate over service entities and retrieve the serviceApiActions for the selected service
        $scope.serviceEntities.some(function(serviceEntity) {
          if(serviceEntity.serviceNameShort == service) {
            serviceEntity.serviceApiActionEntityList.forEach(function(serviceApiAction) {
              $scope.serviceApiActionsData.push({
                id: serviceApiAction.id,
                label: serviceApiAction.apiActionName
              });
            });
          }
        });

      });

    };


    // Setting EnvsData array for Envs column table filter
    if($scope.selectedEnvList.length === 0 ) {
      var envId = 1;
      $scope.envs.forEach(function(env) {
        $scope.envsData.push({
          id: envId++,
          label: env
        });
      });

    } else {
      var envId = 1;
      $scope.selectedEnvList.forEach(function(env) {
        $scope.envsData.push({
          id: envId++,
          label: env
        });
      });
    };
  };

  $scope.populateTableRoleList = function() {
    // The TableRolesList field holds the role names for the table. We are separating this from $scope.selectedRolesList which will be used for filter section only
    // If no roles are selected then it implies we are pulling in all the role data, so we are retrieving all roles from $scope.roleEntities
    $scope.tableRolesList = $scope.selectedRolesList;
    if($scope.tableRolesList.length === 0) {
      $scope.roleEntities.forEach(function(roleEntity) {
        $scope.tableRolesList.push(roleEntity.roleName);
      })
    }
  };



/* Filter retrieval of privileges */
  $scope.runPrivilegeFilter = function() {

    $scope.entriesCount = 0;
    $scope.entries = [];
    $scope.pristineEntries = [];
    $scope.servicesData = [];              // Data that gets displayed on Column Service Filter
    $scope.serviceApiActionsData = [];     // Data that gets displayed on Column ServiceApiAction Filter
    $scope.envsData = [];                  // Data that gets displayed on Column Envs Filter
    $scope.policyEditDisable = true;


    console.log("Selected Roles " + $scope.selectedRolesList);
    console.log("Selected Services " + $scope.selectedServicesList);
    console.log("Environment values: " + $scope.selectedEnvList);

    // Populate Data for  service/ serviceApiActions/ Env column filters
    $scope.createColumnTableFilter();
    // Populate tableRoleList array, which holds the role column entries in the table
    $scope.populateTableRoleList();

    var selectedRoleIds = [];
    // Retrieving RoleId's from rolename
    $scope.selectedRolesList.forEach(function(role) {
      $scope.roleEntities.some(function(roleEntity) {
        if(role === roleEntity.roleName)
          selectedRoleIds.push(roleEntity.id);          
      });
    });

    var selectedServiceIds = [];
    // Retrieving ServiceId's from ServiceNames
    $scope.selectedServicesList.forEach(function(service) {
      $scope.serviceEntities.some(function(serviceEntity) {
        if(service === serviceEntity.serviceNameShort)
          selectedServiceIds.push(serviceEntity.id);          
      });
    });

    var selectedEnvs = $scope.selectedEnvList.length === 0 ? $scope.envs : $scope.selectedEnvList; 

    /** Retrieve Privileges Count */
    privilegeService.getPrivilegesCount(selectedRoleIds, selectedServiceIds, selectedEnvs)
      .then(
        function(response) {
          $scope.privilegesCount = response.data;
          $scope.maxPageNumber = Math.round($scope.privilegesCount/ $scope.paginatedPageSize);
          console.log('Privileges Count :' + $scope.privilegesCount);
          console.log('MaxPageNumber : ' + $scope.maxPageNumber);

          // Divide the count by size of selectedRoleId's coz we transpose the role's onto service api actions
          //$scope.entriesCount = $scope.privilegesCount/(selectedRoleIds.length);
        },
        function(response) {
          alert( "failure message: " + JSON.stringify({data: response.data}));
        }
      );

    // Retrieving filtered privileges
    privilegeService.getPrivilegesUsingFilter(selectedRoleIds, selectedServiceIds, $scope.selectedEnvList)
      .then(
        function(response) {
          $scope.privileges =  response.data;
          $scope.createEntries();
        },
        function(response) {
          alert( "failure message: " + JSON.stringify({data: response.data}));
        }
      );
  };


  /** Create a serviceApiAction per env as it exists in privilege
      Since Service Api Actions get displayed on the privs page, we need to create a service api action for env
      and later append role entity to it.
  */ 
  $scope.createEntries = function() {
    // Making sure $scope.entries is empty before we put more entires
    $scope.entries = [];
    $scope.pristineEntries = [];
    $scope.privileges.forEach(function(privilege) {
      var serviceApiAction;

      $scope.serviceApiActionEntities.some(function(serviceApiActionEntity) {
        //console.log(serviceApiAction)
        if(serviceApiActionEntity.id === privilege.ccwgServiceApiActionGsId) 
          //serviceApiAction = Object.create(serviceApiActionEntity);
        serviceApiAction = JSON.parse(JSON.stringify(serviceApiActionEntity))
      });
      // Adding an environment property to serviceApiAction
      // Here we are pretty much creating n by m permutations and combinations of serviceApiActions by env
      serviceApiAction.environment = privilege.environment;
      // Push the initial serviceApiAction entries but we still need to add roles to each entry
      // We need to transpose all roles that pertain to each entry, coz this is how we have the privs screen
      var entryExists = false;
      // We have to furthur narrow down privileges to have only one row for apiaction + env
      // E.g if filter selects 2 roles and 1 service, the privileges will have two apiaction + env rows,
      // we need only one row as the 2 roles will be superimposed on that one column.
      $scope.entries.some(function(entry) {
            if(entry.id === privilege.ccwgServiceApiActionGsId && entry.environment === privilege.environment)
              entryExists = true;
      });
      if(!entryExists)
        $scope.entries.push(serviceApiAction);
    });    

    /** Once we have created the multiple serviceApiActions with envs, we need to add Env's
        This gets tricky coz, a single row of serviceApiActions + env holds data of all existing roles policy,
        in other words, one entry has APP_DBA: "Deny", APP_DEV: "Allow" and all other roles that exist in privileges for that serviceApiAction + Env

        In this section we will reiterate over all entries and add all role: policy for each serviceApiAction + entry
     */
      
      $scope.entriesCount = $scope.entries.length;      

      $scope.entries.forEach(function(entry) {
        $scope.privileges.forEach(function(privilege) {
          // If the serviceApiAction + Env combination matches, we need to add all Roles that match
          // We have to loop through roleEntity to get the rolename as only roleId exists in privileges
          if(privilege.ccwgServiceApiActionGsId === entry.id && privilege.environment === entry.environment) {
            $scope.roleEntities.some(function(roleEntity) {
              if(roleEntity.id == privilege.ccwgRoleOrgId)
                entry[roleEntity.roleName] = {
                  "proposedValue": privilege.proposedValue,
                  "approvedValue": privilege.approvedValue,
                  "lastApprovedDate": privilege.lastApprovedDate,
                  "privilegeId": privilege.id,
                  "roleId": privilege.ccwgRoleOrgId,
                  "rejectionFlag": privilege.rejectionFlag,
                  "createdDate": privilege.createdDate,
                  "updatedDate": privilege.updatedDate,
                  "createdBy": privilege.createdBy,
                  "updatedBy": privilege.updatedBy
                };
            });
          }
        });
      });
      // Deep copy of entries into pristineEntries
      // pristineEntries is used to make sure the policy of a role really changes from original
      $scope.pristineEntries = JSON.parse(JSON.stringify($scope.entries));
  };

  /** Section to Save privileges */ 
  $scope.createPrivilege = function(roleId, serviceApiActionId, environment, approvedValue, proposedValue, action,
                                  rejectionFlag, createdDate, updatedDate, createdBy, updatedBy, id) {
    var privilege = {};
    privilege.ccwgRoleOrgId = roleId;
    privilege.ccwgServiceApiActionGsId = serviceApiActionId;
    privilege.environment = environment;
    privilege.approvedValue = approvedValue;
    privilege.proposedValue = proposedValue;
    if(id !== null) {
      privilege.id = id; 
    }
    privilege.rejectionFlag = (typeof rejetionFlag === 'undefined') ? null : rejectionFlag;
    privilege.createdDate = createdDate || null,
    privilege.updatedDate = updatedDate || null,
    privilege.createdBy = createdBy || null,
    privilege.updatedBy = updatedBy || null,         
    privilege.action = action;

    return privilege;

  };


  $scope.savePrivileges = function() {
    console.log("Saving privileges!");
    var updatedPrivs = [];
    var updatedEntries = [];
    // Step1: Get list of updated entries
    $scope.entries.forEach(function(entry) {
      if(entry.action == 'U')
        updatedEntries.push(entry);
    });

    // Loop through updatedEntires and find roles that have been updated for each Entry and create a list of privilege entries to be created/updated.
    updatedEntries.forEach(function(entry) {

      // For each entry find the role property that has been updated or newly created(roles which don't have privilegeId fall in this criteria)
      // Create a new privilege entry which is combination of privId + roleId + serviceApiActionId + env, and send proposedValue and approvedValue
      $scope.tableRolesList.some(function(role) {
        // role policy has been updated, check inside if its a new policy being created or change to existing policy
        if(entry.hasOwnProperty(role) && entry[role].action == "U") {
          // If privilegeId exists, existing policy is being changed;          

          if(entry[role].hasOwnProperty("privilegeId")) {
            // proposed value is in approvedValue field
            // existing approved value is in entry[role].actualApprovedValue, which was set in editPolicy() method
            updatedPrivs.push($scope.createPrivilege(entry[role].roleId, entry.id, entry.environment, entry[role].actualApprovedValue, entry[role].approvedValue, "U",
                          entry[role].rejectionFlag, entry[role].createdDate, entry[role].updatedDate, entry[role].createdBy, entry[role].updatedBy, entry[role].privilegeId));
          } else { // new policy is being created for the role.
            updatedPrivs.push($scope.createPrivilege(entry[role].roleId, entry.id, entry.environment, null, entry[role].approvedValue, "I", 
                          entry[role].rejectionFlag, entry[role].createdDate, entry[role].updatedDate, entry[role].createdBy, entry[role].updatedBy, null));

          }          
        }
      });
    });

    // Note: upatedPrivs  ServiceApiActionEntity has transposed fields, hence we had to add annotation"@JsonIgnoreProperties(ignoreUnknown=true)" on backend.
    privilegeService.postPrivileges(updatedPrivs)
      .then(
        function(response) {
          $scope.runPrivilegeFilter();
        },
        function(response) {
          alert( "failure message: " + JSON.stringify({data: response.data}));
        }
      );
  };


  /* Filter Section start */

  $scope.selectFilter = function(userPrivilegeFilter) {

    console.log("Filter changed: " + userPrivilegeFilter);    

    var userFilterEntitySelected;
    $scope.userFilterEntities.forEach(function(userFilterEntity) {
      if(userFilterEntity.filterName === userPrivilegeFilter)
        userFilterEntitySelected = userFilterEntity;
    });

    if((userFilterEntitySelected.defaultFlag || userFilterEntitySelected.globalFlag) && !$scope.isCurrentUserAdmin() ) {
      $scope.canUserEditFilter = false;
    } else {
      $scope.canUserEditFilter = true;
    }

    if(userFilterEntitySelected.roleFilter != null) {
      var roleFilterValues = userFilterEntitySelected.roleFilter.split(',');
      $scope.selectedRolesList = roleFilterValues;
      $scope.msRolesFunction.setValues(roleFilterValues);    
    } else {
      $scope.selectedRolesList = [];
      $scope.msRolesFunction.setValues([]);

    }

    if(userFilterEntitySelected.serviceFilter != null) {
      var serviceFilterValues = userFilterEntitySelected.serviceFilter.split(',');
      $scope.selectedServicesList = serviceFilterValues;
      $scope.msServicesFunction.setValues(serviceFilterValues);       
    } else {
      $scope.selectedServicesList = [];
      $scope.msServicesFunction.setValues([]); 

    }

    if(userFilterEntitySelected.envFilter != null) {
      var envFilterValues = userFilterEntitySelected.envFilter.split(',');
      $scope.selectedEnvList = envFilterValues;
      $scope.msEnvsFunction.setValues(envFilterValues); 
    } else {
      $scope.selectedEnvList = [];
      $scope.msEnvsFunction.setValues([]); 

    }
  };  

  $scope.selectedRoles = function(data) {
    $scope.selectedRolesList = data;
  };


  $scope.selectedServices = function(data) {
    $scope.selectedServicesList = data;
  };

  $scope.selectedEnvs = function(data) {
    $scope.selectedEnvList = data;
  };


  $scope.retrievePrivsFilters = function(defaultFilter,  runPrivilegeFilterFlag) {
    // Setting the privilege filter names to empty array as during push this will cause duplicates
    $scope.userPrivilegeFilters = [];

    userService.getUserFilters($sessionStorage.user.name)
      .then(
        function(response) {
          $scope.userFilterEntities = response.data;
          $scope.userFilterEntities.forEach(function(userFilterEntity) {
            $scope.userPrivilegeFilters.push(userFilterEntity.filterName);
          });

          if(defaultFilter) {
            $scope.userFilterEntities.some(function(userFilterEntity) {
              if(userFilterEntity.filterName === defaultFilter.filterName) {
                $scope.userPrivilegeFilter = userFilterEntity.filterName;
                $scope.selectedRolesList = (userFilterEntity.roleFilter != null) ? userFilterEntity.roleFilter.split(',') : [];
                $scope.selectedServicesList = (userFilterEntity.serviceFilter != null) ? userFilterEntity.serviceFilter.split(',') : [];
                $scope.selectedEnvList = (userFilterEntity.envFilter != null) ? userFilterEntity.envFilter.split(',') : [];
              }
            })
          } else {
            // loop through the userFilterEntities and retrieve the first global filter
            var defaultUserFilterEntity;
            $scope.userFilterEntities.some(function(userFilterEntity) {
              if(userFilterEntity.globalFlag) {
                defaultUserFilterEntity = userFilterEntity;
                if(!$scope.isCurrentUserAdmin()) {
                  $scope.canUserEditFilter = false;
                }
                
              }
            });
            // Set default filter to first filter if no defaultFlag set
            if(typeof defaultUserFilterEntity === "undefined" ) {
              defaultUserFilterEntity = $scope.userFilterEntities[0];
            }

            $scope.userPrivilegeFilter = defaultUserFilterEntity.filterName;
            $scope.selectedRolesList = (defaultUserFilterEntity.roleFilter != null) ? defaultUserFilterEntity.roleFilter.split(',') : [];
            $scope.selectedServicesList = (defaultUserFilterEntity.serviceFilter != null) ? defaultUserFilterEntity.serviceFilter.split(',') : [];
            $scope.selectedEnvList = (defaultUserFilterEntity.envFilter != null) ? defaultUserFilterEntity.envFilter.split(',') : [];
          }
          // Trigger the setValues function in msSelect directive
          $scope.msRolesFunction.setValues($scope.selectedRolesList);
          $scope.msServicesFunction.setValues($scope.selectedServicesList);
          $scope.msEnvsFunction.setValues($scope.selectedEnvList);

          if(runPrivilegeFilterFlag) {
            $scope.runPrivilegeFilter();
          };
          

        },
        function(response) {
          alert( "failure message: " + JSON.stringify({data: response.data}));
        }
      );    

  };

  // Modal to save new filter
  $scope.saveNewFilterOpen = function() {
    var modalInstance = $uibModal.open({
      templateUrl: 'html/privileges/saveNewFilterModal.html',
      controller: 'SaveNewFilterModalController',
      resolve: {
        selectedRoles: function(){ return $scope.selectedRolesList},
        selectedServices: function(){ return $scope.selectedServicesList},
        selectedEnvs: function(){ return $scope.selectedEnvList},
        envs: function(){ return $scope.envs},
        services: function(){ return $scope.services},
        roles: function(){ return $scope.roles}
      }
    });

    modalInstance.result
      .then(
        function(privsFilter) {
          $scope.retrievePrivsFilters(privsFilter, true);
        }, 
        function(response) {
          if(response != 'cancel') {
            alert( "failure message: " + JSON.stringify({data: response.data}));
          }      
      });
  };

  // Modal to delete existing filters
  $scope.deleteFilterOpen = function() {
    var modalInstance = $uibModal.open({
      templateUrl: 'html/privileges/deleteFilterModal.html',
      controller: 'DeleteFilterModalController',
      resolve: {
        userPrivilegeFilter: function(){ return $scope.userPrivilegeFilter},
        userFilterEntities: function(){ return $scope.userFilterEntities}
      }
    });

    modalInstance.result
      .then(
        function() {
          $scope.retrievePrivsFilters(null, true);
        }, 
        function(response) {
          if(response != 'cancel') {
            alert( "failure message: " + JSON.stringify({data: response.data}));
          }         
      });
  };  

  // Modal to Save existing filters
  $scope.saveFilterOpen = function() {
    var modalInstance = $uibModal.open({
      templateUrl: 'html/privileges/saveFilterModal.html',
      controller: 'SaveFilterModalController',
      resolve: {
        selectedRoles: function(){ return $scope.selectedRolesList},
        selectedServices: function(){ return $scope.selectedServicesList},
        selectedEnvs: function(){ return $scope.selectedEnvList},
        envs: function(){ return $scope.envs},
        services: function(){ return $scope.services},
        roles: function(){ return $scope.roles},
        userPrivilegeFilter: function(){ return $scope.userPrivilegeFilter},
        userFilterEntities: function(){ return $scope.userFilterEntities}
      }
    });

    modalInstance.result
      .then(
        function(privsFilter) {
          $scope.retrievePrivsFilters(privsFilter, true);
        }, 
        function(response) {
          if(response != 'cancel') {
            alert( "failure message: " + JSON.stringify({data: response.data}));
          }         
      });
  };  

  /* Filter Section End*/


  /**
    Initialize method which does the following
      (1) Retrieves RoleEntities and populates $scope.roles
      (2) Retrieves ServiceEntities and populates $scope.services
      (3) Retrieves ServiceApiActions and populates $scope.serviceApiActionEntities
      (4) Runs privilegeFilter method to get default privileges based on default filters
  */
  $scope.initialize = function() {    

    // Retrieve role entities which can be used later to create privileges 
    roleService.getRoles()
      .then(
        function(response) {
          $scope.roleEntities = response.data;
          $scope.roleEntities.forEach(function(roleEntity) {
            $scope.roles.push(roleEntity.roleName);
            $scope.rolesLoaded = true;
          });
        },
        function(response) {
          alert( "failure message: " + JSON.stringify({data: response.data}));
        }
      );

    serviceRest.getServices()
      .then(
        function(response) {
          $scope.serviceEntities = response.data;
          $scope.serviceEntities.forEach(function(serviceEntity) {
            $scope.services.push(serviceEntity.serviceNameShort);
            $scope.servicesLoaded = true;
          });          
        },
        function(response) {
          alert( "failure message: " + JSON.stringify({data: response.data}));
        }
      );

    serviceRest.getServiceApiActions()
      .then(
        function(response) {
          $scope.serviceApiActionEntities = response.data;
          $scope.serviceApiActionsLoaded = true; 
          // We run privileges after we pull all the ApiActions as privs are basically serviceApiActions + Envs + (Transpose all roles on these entries) 
          //$scope.runPrivilegeFilter();     
          /* Retrieve user privilege filters */
          $scope.retrievePrivsFilters(null, true);      
        },
        function(response) {
          alert( "failure message: " + JSON.stringify({data: response.data}));
        }
      );      

    // Adding envs creation here coz lookup service takes some time to load envs.
    lookupService.retrieveReferences()
      .then(
        function(response) {
          $scope.envs = response.environments;
          $scope.policies = response.privilegesSettingValues;
          $scope.envsLoaded = true;
        },
        function(response) {
          alert( "failure message: " + JSON.stringify({data: response.data}));
        }

      );
  };

  $scope.initialize(); 




}]);