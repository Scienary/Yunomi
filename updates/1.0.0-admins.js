/**
 * This script automatically creates a default Admin user when an
 * empty database is used for the first time. You can use this
 * technique to insert data into any List you have defined.
 *
 * Alternatively, you can export a custom function for the update:
 * module.exports = function(done) { ... }
 */

exports.create = {
    Admin: [
        { 'name.first': 'Ahmet', 'name.last': 'Cavus', 'email': 'ahmet.cavus@fikirdek.com', 'password': 'testtest', 'isAdmin': true },
        { 'name.first': 'Emrah', 'name.last': 'Eker', 'email': 'emrah.eker@fikirdek.com', 'password': 'testtest', 'isAdmin': true },
        { 'name.first': 'Tunahan', 'name.last': 'Eyigoz', 'email': 'tunahan.eyigoz@fikirdek.com', 'password': 'testtest', 'isAdmin': true },
        { 'name.first': 'Mehmet', 'name.last': 'Kozan', 'email': 'mehmet.kozan@fikirdek.com', 'password': 'testtest', 'isAdmin': true },
        { 'name.first': 'Suleyman', 'name.last': 'Balci', 'email': 'suleyman.balci@fikirdek.com', 'password': 'testtest', 'isAdmin': true }
    ],
    Client: [
        { 'name.first': 'Ahmet', 'name.last': 'Cavus', 'email': 'ahmet.cavus@fikirdek.com', 'password': 'testtest' },
        { 'name.first': 'Emrah', 'name.last': 'Eker', 'email': 'emrah.eker@fikirdek.com', 'password': 'testtest' },
        { 'name.first': 'Tunahan', 'name.last': 'Eyigoz', 'email': 'tunahan.eyigoz@fikirdek.com', 'password': 'testtest' },
        { 'name.first': 'Mehmet', 'name.last': 'Kozan', 'email': 'mehmet.kozan@fikirdek.com', 'password': 'testtest' },
        { 'name.first': 'Suleyman', 'name.last': 'Balci', 'email': 'suleyman.balci@fikirdek.com', 'password': 'testtest' }
    ]
};

/*

// This is the long-hand version of the functionality above:

var keystone = require('keystone');
var async = require('async');
var User = keystone.list('User');

var admins = [
	{ email: 'user@keystonejs.com', password: 'admin', name: { first: 'Admin', last: 'User' } }
];

function createAdmin (admin, done) {

	var newAdmin = new User.model(admin);

	newAdmin.isAdmin = true;
	newAdmin.save(function (err) {
		if (err) {
			console.error('Error adding admin ' + admin.email + ' to the database:');
			console.error(err);
		} else {
			console.log('Added admin ' + admin.email + ' to the database.');
		}
		done(err);
	});

}

exports = module.exports = function (done) {
	async.forEach(admins, createAdmin, done);
};

*/