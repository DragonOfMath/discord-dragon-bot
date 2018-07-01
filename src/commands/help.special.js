module.exports = {
	id: 'suicide-prevention-lifeline',
	permissions: 'public',
	resolver({message}) {
		if (/(i want|i('?| a)m going) to (kill myself|commit suicide|end my(self| life))/i.test(message)
		|| /i('?| a)m (feeling suicidal|on suicide watch|ending my life|killing myself)/i.test(message)
		|| /i (feel like killing myself)/i.test(message)
		//|| /i want to die/i.test(message)
		|| /put(ting)? an end to my (life|misery)/i.test(message)
		|| /put(ting)? (myself|me) out of my misery/i.test(message)) {
			return 'reply';
		}
	},
	events: {
		reply({client, userID}) {
			client.sendMessage(userID,'I have detected that you are in a stressful situation right now. Please reconsider what you are about to do.',
			{
				description: 'Suicide is never the solution. There are plenty of people who want to understand you and your problems, and help you recover from any difficulties you are experiencing. Take a look at the options below:',
				fields: [
					{
						name: 'Suicide Prevention Lifeline',
						value: 'Please call **+1-800-273-8255** or visit the **[Suicide Prevent Lifeline website](http://www.suicidepreventionlifeline.org/)** to talk with a caring person one-on-one. They will help you calm down and work with you to reclaim your rationality.'
					},
					{
						name: 'Talk with Police',
						value: 'If you feel your life is in danger, please contact the police by phone or by **[visiting their office building](https://www.google.com/maps?q=nearest+police+station)**, open 24/7. Explain that you feel threatened and why, they will offer you protection and reassurance.'
					},
					{
						name: 'Find the Nearest Hospital',
						value: 'If you feel you are not well, please reach out to **[the nearest hospital](https://www.google.com/maps?q=nearest+hospital)** or care unit and ask for immediate care. They are obligated to help you.'
					},
					{
						name: 'Relationship Advice',
						value: 'If you are trying to cope during/after a bad relationship, please **[contact a human being](https://www.google.com/?q=relationship+advisor)** who can point you in the right direction.'
					},
					{
						name: 'Financial Advice',
						value: 'If you are in financial jeopardy, please **[talk with an advisor](https://www.google.com/?q=financial+advisor)** as soon as possible. They will assess your situation and provide optimal advice for success.'
					},
					{
						name: 'Legal Advice',
						value: 'If you need help with a legal issue, please consider hiring a lawyer or legal advisor to cooperate with you. **[Get free legal advice](https://www.reddit.com/r/LegalAdvice)**.'
					},
					{
						name: 'Religious Advice',
						value: 'If you wish to speak with a religious figure, such as a pastor, please contact your local church, synagogue, mosque, or place of worship. There you will be safe from all harm and you may speak freely about your troubles.'
					}
				]
			});
		}
	}
};
