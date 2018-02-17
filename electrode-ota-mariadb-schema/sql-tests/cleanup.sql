-- cleanup
DELETE FROM metric WHERE 1 = 1;
DELETE FROM client_ratio WHERE 1 = 1;
DELETE FROM package_tag WHERE 1 = 1;
DELETE FROM package_diff WHERE 1 = 1;
DELETE FROM deployment_package_history WHERE 1 = 1;
DELETE FROM package WHERE 1 = 1;
DELETE FROM deployment_app WHERE 1 = 1;
DELETE FROM deployment WHERE 1 = 1;
DELETE FROM user_auth_provider WHERE 1 = 1;
DELETE FROM access_key WHERE 1 = 1;
DELETE FROM app_permission WHERE 1 = 1;
DELETE FROM app WHERE 1 = 1;
DELETE FROM user WHERE 1 = 1;