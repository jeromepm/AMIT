function select_proj(pid){
  let f = document.getElementById('project_tables').rows.item(pid).cells.item(0).innerHTML;
  document.location.href = '/?pro='+f + '&a=conf';
}

function remove_sources(){
  let btn = document.getElementById('create');
  if (btn.disabled){
    btn.removeAttribute("disabled");
  } else {
    btn.disabled = true
  }
  open_close('auto_sources');
}

  function start_new() {
    const f = document.getElementsByClassName('create_project');
    let t = document.getElementById('project_div');
    //let tb = document.getElementById('project_div');
    let btn = document.getElementById('start_new');

    if (btn.innerHTML == 'New'){
      for (var i = f.length - 1; i >= 0; i--) {
        f[i].style.display = 'block'
      }
      if (t !== null){ 
        t.style.display = 'none'; 
        //tb.style.display = 'none';
       }
      document.getElementById('new_0').style.display = 'block';
      document.getElementById('new_howto_0').style.display = 'block';
      document.getElementById('new_1').style.display = 'none';
      document.getElementById('new_howto_1').style.display = 'none';
      btn.innerHTML = 'Cancel';
    } else {
      for (var i = f.length - 1; i >= 0; i--) {
        f[i].style.display = 'none'
      }      
      if (t !== null){ 
        t.style.display = 'block';
        }
      btn.innerHTML = 'New';
    }
  }

  function enable_next(btn_id){
    let text = document.getElementById("pname").value;
    let desc = document.getElementById("pdescr").value;
    let l = document.getElementById("lnames").value;
    let labels = l.split(",")
    filter_labels = labels.filter(function(v) { return v !== document.getElementById("ctrl_name").value })
    real_labels = filter_labels.filter(function(v) { return v !== '' })
    console.log(real_labels.length)
    if (text.trim().length > 4 & desc.trim().length > 4 & real_labels.length > 0){
      console.log(btn_id)
      document.getElementById('next_'+ btn_id).disabled = false;
    }
  }

  function next_new(num){
    if (num == 1) {
      document.getElementById('new_' + (num - 1)).style.display = 'block';
      document.getElementById('new_howto_' + (num - 1)).style.display = 'block';
      document.getElementById('next_' + num).style.display = 'none';
      document.getElementById('next_' + (num - 1)).style.display = 'none';
      document.getElementById('create').disabled = false;
    } else {
      document.getElementById('new_' + num).style.display = 'none';
      document.getElementById('new_howto_' + num).style.display = 'none';
      new_num = num + 1
      document.getElementById('new_' + new_num).style.display = 'block';
      document.getElementById('new_howto_' + new_num).style.display = 'block';
    }
  }

  function check_url() {
    const urls = document.getElementsByName('surl');
    console.log(urls)
    let data = JSON.stringify({ "url": urls[urls.length - 1].value });
    console.log(data)
    let xhr = new XMLHttpRequest();
    xhr.withCredentials = false;

    xhr.addEventListener("readystatechange", function() {
    if(this.readyState === 4) {
      console.log(this.responseText);
      if (this.responseText == 'error'){
        let d = document.createElement("div")
        let p = document.createElement("p")
        let text = 'The following entry did not work: ' + urls[urls.length - 1].value + ' please fix the url prior to adding.'
        p.innerHTML = text
        d.appendChild(p)
        let btn1 = document.createElement("button");
        btn1.type = 'button'
        btn1.innerHTML = 'Go Back'
        btn1.setAttribute("onclick", "open_close('modal')")
        d.appendChild(btn1)
        display_modal('warning',d,'orange');
      }
      if (this.responseText == 'ok'){
        document.getElementById('add_source').disabled = false;
      }
    }
    });

    xhr.open("POST", "/verify");
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.send(data);
  }