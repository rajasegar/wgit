'use strict';

const prompts = require('prompts');
const fs = require('fs');

module.exports = function () {
  const starterPrompt = [
    {
      type: 'text',
      name: 'owner',
      message: 'Enter github user id:',
    },
    {
      type: 'text',
      name: 'repo',
      message: 'Enter the repository name:',
    },
  ];

  (async () => {
    let answers = await prompts(starterPrompt);
    const { owner, repo } = answers;
    require('dotenv').config();
    const { Octokit } = require('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GH_PAT });

    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: '',
    });

    const _choices = response.data
      .filter((f) => f.type === 'file')
      .map((f) => {
        return { title: f.name, value: f.path };
      });

    const choosePrompt = {
      type: 'multiselect',
      name: 'files',
      message: 'Choose files to copy:',
      choices: _choices,
    };

    answers = await prompts(choosePrompt);
    const { files } = answers;

    files.forEach((file) => {
      octokit.repos
        .getContent({
          owner,
          repo,
          path: `${file}`,
        })
        .then((response) => {
          const fileData = Buffer.from(response.data.content, 'base64');
          console.log(fileData.toString());

          // Write file
          fs.writeFile(`${file}`, fileData, (err) => {
            if (!err) {
              console.log(`${file} written successfully.`);
            } else {
              console.log(err);
            }
          });
        });
    });
  })();
};
