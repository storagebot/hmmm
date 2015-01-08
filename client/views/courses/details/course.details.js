"use strict";

Router.map(function () {
	this.route('showCourse', {
		path: 'course/:_id/:slug?',
		template: 'coursedetails',
		waitOn: function () {
			return [
				Meteor.subscribe('categories'),
				Meteor.subscribe('courseDetails', this.params._id),
				Meteor.subscribe('eventsForCourse', this.params._id),
				Meteor.subscribe('groups')
			]
		},
		data: function () {
			var self = this;
			var course = Courses.findOne({_id: this.params._id});
			if (!course) return;
			   
			var userId = Meteor.userId();
			var member = getMember(course.members, userId);
			var data = {
				edit: !!this.params.query.edit,
				roleDetails: loadroles(course),
				course: course,
				member: member
			};
			if (mayEdit(Meteor.user(), course)) {
				data.editableName = makeEditable(
					course.name, 
					true,
					function(newName) {
						Meteor.call("save_course", course._id, { name: newName }, function(err, courseId) {
							if (err) {
								addMessage(mf('course.saving.error', { ERROR: err }, 'Saving the course went wrong! Sorry about this. We encountered the following error: {ERROR}'));
							} else {
								addMessage(mf('course.saving.success', { NAME: course.name }, 'Saved changes to {NAME}'));
							}
						});
					}
				);
				data.editableDescription = makeEditable(
					course.description, 
					false,
					function(newDescription) {
						Meteor.call("save_course", course._id, { description: newDescription }, function(err, courseId) {
							if (err) {
								addMessage(mf('course.saving.error', { ERROR: err }, 'Saving the course went wrong! Sorry about this. We encountered the following error: {ERROR}'));
							} else {
								addMessage(mf('course.saving.success', { NAME: course.name }, 'Saved changes to {NAME}'));
							}
						});
					}
				);
			}
			return data;
		},
		onAfterAction: function() {
			var data = this.data();
			if (data) {
				var course = data.course;
				document.title = webpagename + 'Course: ' + course.name
				
				// This hack subscribes us for the docs required to display userinfo
				Meteor.subscribe('userSelection', _.pluck(course.members, 'user'));				
			}
		}
	})
	this.route('showCourseWiki', {
		path: 'course/:_id/:slug/wiki',
		template: 'coursewiki',
		waitOn: function () {
			return [
				Meteor.subscribe('categories'),
			    Meteor.subscribe('courseDetails', this.params._id)
			]
		},
		data: function () {
			var course = Courses.findOne({_id: this.params._id})
			return {
				course: course
			};
		}
	})

})

function loadroles(course) {
	var userId = Meteor.userId();
	return _.reduce(Roles.find({}, {sort: {type: 1} }).fetch(), function(goodroles, roletype) {
		var role = roletype.type
		var sub = hasRoleUser(course.members, role, userId);
		if (course.roles.indexOf(role) !== -1) {
			goodroles.push({
				roletype: roletype,
				role: role,
				subscribed: !!sub,
				anonsub: sub == 'anon',
				course: course
			})
		}
		return goodroles;
	}, []);
}


Template.coursedetails.helpers({    // more helpers in course.roles.js
	currentUserMayEdit: function() {
		return mayEdit(Meteor.user(), this);
	}
});

Template.coursedetails.events({
	'click input.del': function () {
		if(!Meteor.userId()) {
			alert("Please log in!");
			return;}

		if (confirm("really?")) {
			Courses.remove(this._id);
			Router.go('/');
		}
	},
	'click input.edit': function () {
		if(!Meteor.userId()) {
			alert("Please log in!");
			return;
		}
		Router.go('showCourse', this, { query: {edit: 'course'} })

	}
})

