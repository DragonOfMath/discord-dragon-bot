/**
	This file will help get you started to make your own useful bot commands.
*/


// Various utilities for making a useful command
const Promise = require('bluebird');     // Promises
const request = require('request');      // web requests
const fs      = require('fs');           // ilesync operations
const URL     = require('url');          // file and web URL parsing
const mysql   = require('mysql');        // mySQL database
const parse5  = require('parse5');       // HTML5 parser
const {Bignum:bn,fetch,random,Markdown:md,Format:fmt} = require('../Utils'); // utilities from /src/utils

// Command Descriptor Schema
module.exports = {
	// This is a top-level command.
	// The key is the name/id, it may not contain spaces or punctuation marks (except ?).
	// Case does not matter except if it overwrites an internal property.
	// Most properties are optional! But to use them anyways is good practice.
	'myTestCmd': {
		
		// You can assign several different names for the same command.
		aliases: ['commandAlias'], 
		
		// A category groups commands together
		// Categories cannot have spaces or punctuation marks
		// Subcommands inherit the category
		category: 'Misc',
		
		// Set a title that is displayed when the command is used.
		// For subcommands, this adds a '|' between titles
		title: 'Command Title',
		
		// A description about the command goes here.
		info: 'Information about a command.',
		
		// Arguments the command requires or can use go here.
		// These follow a syntax and are checked for validation when the command is ran.
		// Syntax:
		//   argument      = 1 required argument
		//   [argument]    = 1 optional argument
		//   ...argument   = infinite required arguments
		//   [...argument] = infinite optional arguments
		//   "argument"    = exact argument as the string
		//   <arg|um|ent>  = choice argument (alternative to string argument)
		parameters: ['argument1', '[optionalArgument]', '...infiniteArgs'],
		
		// Override the default permissions type.
		//  * Inclusive use means only the listed users, roles, channels, or servers may use it.
		//  * Exclusive use means the listed users, roles, channels, or servers may *not* use it.
		//  * Public means it's available to everyone.
		//  * Private means it's available only to the bot owner.
		//  * Privileged means it's available only to users that manage the guild.
		//  * Inherit means it uses the permissions of its supercommand (if it has one, otherwise it defaults to something)
		// By default, subcommands use inherit and supercommands use inclusive.
		permissions: 'inclusive',
		
		// Special properties that this command uses.
		// These can be accessed with this.prop(x), but cannot be overwritten.
		// Subcommands inherit properties in their namespace.
		properties: {
			specialPropVal: 25
		},
		
		// Hides the command and its subcommands from listings
		suppress: true,
		
		// Prevents counting the uses of the command
		analytics: false,
		
		// The function used to run the command.
		// If left out, the default handler displays the title and info.
		// You can use object destructuring to get several important keys:
		fn({client, args, userID, channelID, serverID, messageID}) {
			
			// use the above parameters for executing the command
			// * client is the bot object, you will almost always use this
			// * clientID is the bot's ID
			// * args is an array of arguments passed to the command
			// * arg is the string version of the arguments
			// * userID is the ID of the user that gave the command
			// * user is the object
			// * channelID is the ID of the channel where the command was posted
			// * channel is the object
			// * serverID is the ID of the server where the command was posted
			// * server is the object
			// * messageID is the ID of the message that was last sent in the channel
			// * message is the full text
			
			return 'Hello!'
		},
		
		// Subcommands that are in this command's namespace
		subcommands: {
			// The format is recursive, making it the most powerful command setup yet!
		}
	}
};
