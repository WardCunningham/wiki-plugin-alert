
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

  function emit($item, item) {
    let parsed = parse(item.text)
    $item.append(`
      <div style="background-color:#eee; padding:15px; margin-block-start:1em; margin-block-end:1em;">
        <div class=binding>waiting</div>
        <center><button disabled>wait</button></center>
      </div>`);
  }

  function bind($item, item) {
    $item.dblclick(() => {
      action({action:'stop'})
      return wiki.textEditor($item, item);
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
