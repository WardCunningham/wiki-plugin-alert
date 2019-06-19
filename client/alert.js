
(function() {
  var bind, emit, expand;

  expand = text => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*(.+?)\*/g, '<i>$1</i>');
  };

  function parse(text, $item) {
    let output = expand(text)
    let candidates = $(`.item:lt(${$('.item').index($item)})`)
    let who = candidates.filter('.server-source')
    let sources = []
    if (who.size()) {
      output += $.map(who, (whom) => {
        let service = whom.service()
        if (service.plugin != 'detect') return ''
        console.log({service})
        let source = {slugitem: `${service.slug}/${service.id}`, service}
        sources.push(source)
        return `<p class=caption>${service.title}</p>`
      }).join("\n")
    } else {
      output += "<p class=caption>can't find service to monitor</p>"
    }
    console.log('parse return sources', sources)
    console.log('parse return output', output)
    return {sources, output}
  }

  function editor($item, item) {
    let $editor = $(
      `<form style="background-color:#eee; padding:15px; margin-block-start:1em; margin-block-end:1em;">
        <center>
          <input name=access type=text style="width:95%;" placeholder="AWS Access Key Id"></input><br>
          <input name=secret type=text style="width:95%;" placeholder="AWS Secret Access Key"></input><br>
          <input name=region type=text style="width:95%;" placeholder="AWS Region"></input><br>
          <input name=snsarn type=text style="width:95%;" placeholder="AWS SNS ARN"></input><br>
          <button>test</button>
        </center>
      </form>`
    )
    $editor
      .focusout(focusoutHandler)
      .bind('keydown',keydownHandler)

    function keydownHandler (e) {
      if (e.which == 27) {// esc for save
        e.preventDefault()
        $editor.focusout()
        return false
      }

      if ((e.ctrlKey || e.metaKey) && e.which == 83) { // ctrl-s for save
        e.preventDefault()
        $editor.focusout()
        return false
      }

      if ((e.ctrlKey || e.metaKey) && e.which == 73) { // ctrl-i for information
        e.preventDefault()
        page = e.shiftKey ? null : $(e.target).parents('.page') 
        link.doInternalLink("about #{item.type} plugin", page)
        return false
      }

      if ((e.ctrlKey || e.metaKey) && e.which == 77) { // ctrl-m for menu
        e.preventDefault()
        $item.removeClass(item.type).addClass(item.type = 'factory')
        $editor.focusout()
        return false
      }
    }

    function focusoutHandler (e) {
      $item.removeClass('textEditing')
      $textarea.unbind()
      $page = $item.parents('.page:first')
      plugin.do($item.empty(), item)
    }

    $item.addClass('textEditing')
    $item.unbind()
    $item.html($editor)
    $item.find('button').click(e => {
      console.log('click',e)
    })
    $item.focus()
  }

  function emit($item, item) {
    let parsed = parse(item.text)
    let $editor = $()
    $item.append(`
      <div style="background-color:#eee; padding:15px; margin-block-start:1em; margin-block-end:1em;">
        <div class=binding>waiting</div>
        <center><button disabled>wait</button></center>
      </div>`);
  }

  function bind($item, item) {
    $item.dblclick(() => {
      action({action:'stop'})
      return editor($item, item);
    });

    let $button = $item.find('button')
    let parsed = parse(item.text, $item)
    $item.find('.binding').html(parsed.output)

    function action(command) {
      console.log({command})
      $button.prop('disabled',true)
      let $page = $item.parents('.page')
      if($page.hasClass('local')) {
        return
      }
      let slug = $page.attr('id').split('_')[0]
      $.ajax({
        type: "POST",
        url: `/plugin/alert/${slug}/id/${item.id}`,
        data: JSON.stringify(command),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function(data){
          $button.text((data.status == 'active') ? 'stop' : 'start')
          $button.prop('disabled',false)
        },
        failure: function(err) {
          console.log(err)
        }
      })
    }
    $button.click(event => action({action:$button.text(),schedule:{sources:parsed.sources}}))
    action({})
  }

  if (typeof window !== "undefined" && window !== null) {
    window.plugins.alert = {emit, bind};
  }

  if (typeof module !== "undefined" && module !== null) {
    module.exports = {expand};
  }

}).call(this);
