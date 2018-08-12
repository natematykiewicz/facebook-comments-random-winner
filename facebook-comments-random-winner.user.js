// ==UserScript==
// @author       Nate Matykiewicz
// @name         Facebook Comments Random Winner
// @namespace    https://github.com/natematykiewicz
// @version      1
// @description  Choose a random commenter from a post on Facebook
// @match        https://www.facebook.com/groups/*/permalink/*
// ==/UserScript==

(function() {
  'use strict';

  var root = document.getElementById('pagelet_group_mall')
  var loadingClass = 'loading'

  var css = `
  @keyframes rotate-forever {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  #random-comment-drawing {
    position: absolute;
    top: 10px;
    right: -10px;
    background: #4267b2;
    border: 0;
    color: #fff;
    border-radius: 2px; transform:
    translateX(100%);
    padding: 5px 8px;
    cursor: pointer;
  }

  #random-comment-drawing:active {
    opacity: 0.8;
  }

  #random-comment-drawing.${loadingClass} {
    cursor: default;
    filter: grayscale(1);
  }

  #random-comment-drawing.loading:after {
    animation-iteration-count: infinite;
    animation-name: rotate-forever;
    animation-duration: 1.25s;
    animation-timing-function: linear;
    width: 0.3em;
    height: 0.3em;
    border: 0.2em solid rgba(255,255,255,0.75);
    border-right-color: transparent;
    border-radius: 50%;
    display: inline-block;
    content: '';
    margin-left: 0.5em;
    line-height: 0.3em;
    vertical-align: middle;
  }
  `

  function loadComments(){
    return new Promise((resolve, reject) => {
      var nodes = root.querySelectorAll('.commentable_item .UFIPagerLink')
      if (nodes.length > 1) {
        alert('Cannot load comments. Multiple "View more comments" links found.')
        reject()
      } else if (nodes.length == 1) {
        var node = nodes[0]
        if (node.querySelector('[role=progressbar]') == null) { node.click() }
        setTimeout(() => { return loadComments().then(resolve) }, 300)
      } else {
        resolve()
      }
    })
  }

  function waitForReplyLoad(){
    return new Promise((resolve, reject) => {
      var replies = [].slice.call(root.querySelectorAll('.UFIReplyList'))
      var allRepliesLoaded = replies.every((c) => { return c.querySelector('.UFIComment') != null })

      if (allRepliesLoaded) {
        resolve()
      } else {
        setTimeout(() => { return waitForReplyLoad().then(resolve) }, 300)
      }
    })
  }

  function loadReplies(){
    return new Promise((resolve, reject) => {
      root.querySelectorAll('.UFIReplyList .UFICommentLink').forEach((c) => c.click())
      waitForReplyLoad().then(resolve)
    })
  }

  function chooseWinner(dedupe) {
    return new Promise((resolve, reject) => {
      var comments = []

      root.querySelectorAll('.UFIComment').forEach((c) => {
        var comment = {}
        comment.name = c.querySelector('.UFICommentActorName').childNodes[0].nodeValue
        comment.text = c.querySelector('.UFICommentBody').innerText
        comment.timestamp = c.querySelector('.UFISutroCommentTimestamp').getAttribute('title')

        var url = c.querySelector('.UFICommentActorName').getAttribute('href')
        comment.profileUrl = url.split(url.indexOf('profile.php') == -1 ? '?' : '&')[0]

        comments.push(comment)
      })

      var commenters = comments.map(c => c.profileUrl)
      if(dedupe) { commenters = Array.from(new Set(commenters)) }

      var winnerUrl = commenters[Math.floor(Math.random() * commenters.length)]
      var winnerComments = comments.filter(c => c.profileUrl == winnerUrl)
      var winnerPosts = winnerComments.map(c => '"' + c.text + '"\n  -' + c.timestamp).join('\n')
      var winnerName = winnerComments[0].name

      window.scrollTo(0, 0)
      button.classList.remove(loadingClass)

      var prefix = dedupe ? 'People Commented' : 'Total Comments'

      setTimeout(() => {
        alert(commenters.length + ' ' + prefix + '\n\nThe winner is:\n' + winnerName + '\n\nProfile:\n' + winnerUrl + '\n\nComments:\n' + winnerPosts)
      }, 50)
    })
  }

  function randomDrawing() {
    if (button.classList.contains('loading')) { return }
    if (confirm('Do you want to pick a random commenter?') != true) { return }
    var dedupe = confirm('Remove duplicate comments?')

    button.classList.add(loadingClass)

    loadComments()
    .then(loadReplies)
    .then(() => chooseWinner(dedupe))
    .catch((e) => {
      button.classList.remove(loadingClass)
      console.error(e);
      alert('An unexpected error has occurred.')
    })
  }

  var style = document.createElement('style')
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css))
  document.head.appendChild(style);

  var button = document.createElement('button')
  button.id = 'random-comment-drawing'
  button.innerText = 'Random Drawing'
  button.onclick = randomDrawing

  // Append to #content, since they use ajax and pushstate a lot.
  // Appending to any node higher will result in the button lingering on navigation.
  document.getElementById('content').appendChild(button)
})();
