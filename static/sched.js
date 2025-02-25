  function verify_sched() {
    const form = document.getElementById("new_schedule")
    let formData = new FormData(form);
    let pattern = /(\d+)([a-zA-Z])/i;
    let interval = formData.get('freq').match(pattern);
    let error = false
    let error_text = '<b>Please correct the following errors:</b><br><br>'
    if (formData.get('schname').trim() == '' || formData.get('schname').trim().length < 5 || formData.get('schname').trim().length > 50) {
      document.getElementById('schname').classList.add("input_error");
      error_text = error_text + '&#9873; Please make sure the shcedule name is between 5 and 50 charecters.<br>'
      error = true
    } else {
      document.getElementById('schname').classList.remove("input_error");
    }

    if (formData.getAll("image_source").length == 0) {
      document.getElementById('img_src_tbl').classList.add("input_error");
      error_text = error_text + '&#9873; Please select at lease one image source from the table.<br>'
      error = true
    } else {
      document.getElementById('img_src_tbl').classList.remove("input_error");
    }

    if (formData.getAll("day_of_week").length == 0 && formData.has("every_day") == false) {
      document.getElementById('dow_choices').classList.add("input_error");
      error_text = error_text + '&#9873; Please select at least one day of the week or "Every Day".<br>'
      error = true
    } else {
      document.getElementById('dow_choices').classList.remove("input_error");
    }
    if (error == true){
      let d = document.createElement("div");
      let p = document.createElement("p");
      p.innerHTML = error_text
      d.appendChild(p)
      let btn1 = document.createElement("button");
      btn1.type = 'button'
      btn1.innerHTML = 'Go Back'
      btn1.setAttribute("onclick", "open_close('modal')")
      d.appendChild(btn1)
      display_modal('error',d,'#ff4500');      
    } else {
      let diffMins = 0
      let total_days = 0
      let sources = 0
      console.log(Object.fromEntries(formData));
      console.log(formData.getAll("day_of_week"))
      console.log(formData.getAll("image_source"))
      let s_hour = (formData.get('strt_12hrap') == 'AM') ? Number(formData.get('strt_hr')) : Number(formData.get('strt_hr')) + 12
      let e_hour = (formData.get('end_12hrap') == 'AM') ? Number(formData.get('end_hr')) : Number(formData.get('end_hr')) + 12
      if (s_hour == e_hour || formData.get('all_day') ){
        diffMins = 1440
      } else {
        let today = new Date()
        let tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1)
      let start_date = new Date(today.getFullYear(), today.getMonth(), today.getDate(),s_hour, Number(formData.get('strt_min  '))).getTime()
      let end_date = new Date(today.getFullYear(), today.getMonth(), today.getDate(),e_hour, Number(formData.get('end_min'))  ).getTime()
        diffMins = Math.round((end_date - start_date) / 60000); // minutes
      }
      let in_day = 0
      if (interval[2] == 'm') {
        in_day = ( diffMins / Number(interval[1]) )
      } else if (interval[2] == 'h') {
        in_day = ( (diffMins/60) / Number(interval[1]) )
      }
      if (formData.has('every_day')){
        total_days = 7
      } else if (formData.has('day_of_week')){
        total_days = formData.getAll("day_of_week").length
      }
      if (formData.has('image_source')){
        sources = formData.getAll("image_source").length
      } 
      console.log('This schedule will take ' + (sources * in_day) + ' images in a day, ' + (sources * total_days * in_day) + ' a week.')
      let content = document.createElement("div");
      let p = document.createElement("h4");
      p.textContent = 'This schedule will create the following amount of images.'
      content.appendChild(p)
      content.appendChild(document.createElement("br"))
      p = document.createElement("p")
      p.textContent = (sources * in_day) + ' images in a day.'
      content.appendChild(p)
      p = document.createElement("p")
      p.textContent = (sources * total_days * in_day) + ' a week.'
      content.appendChild(p)
      p = document.createElement("p")
      p.textContent = 'Is this an acceptable number of images?'
      content.appendChild(p)
      let btn = document.createElement("button");
      btn.type = 'button'
      btn.innerHTML = 'Continue'
      btn.setAttribute("onclick", "create_schedule()")
      content.appendChild(btn)
      let btn1 = document.createElement("button");
      btn1.type = 'button'
      btn1.innerHTML = 'Go Back'
      btn1.setAttribute("onclick", "open_close('modal')")
      content.appendChild(btn1)
      display_modal('info',content,'#0a66c2');
    }
  }

  function create_schedule() {
    const form = document.getElementById("new_schedule");
    let formData = new FormData(form);
    var http = new XMLHttpRequest();
    http.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        window.location.href = http.responseURL;
      }
    });
    http.open("POST", "/schedule/create");
    http.send(formData);
  }

  function verify_del(sch_id,sch_name){
    let d = document.createElement("div")
    let p = document.createElement("p")
    let text = 'Are you sure you want to delete schedule: ' + sch_name
    p.innerHTML = text
    d.appendChild(p)

    let btn = document.createElement("button");
    btn.type = 'button'
    btn.innerHTML = 'Coninue'
    btn.setAttribute("onclick", "delete_schedule('"+sch_id+"')")
    d.appendChild(btn)
    let btn1 = document.createElement("button");
    btn1.type = 'button'
    btn1.innerHTML = 'Go Back'
    btn1.setAttribute("onclick", "open_close('modal')")
    d.appendChild(btn1)    
    display_modal('confirmation',d,'#0a66c2');
  }

  function delete_schedule(sch_id) {
    let formData = new FormData();
    formData.append('sch_id', sch_id);
    var http = new XMLHttpRequest();
    http.addEventListener("readystatechange", function() {
      if(this.readyState === 4) {
        window.location.href = http.responseURL;
      }
    });
    http.open("POST", "/schedule/delete");
    http.send(formData);
  }
  function edit_sch(idx) {
    //TODO: Finish setting edit sch funtion to fill in config
    tb = document.getElementById('sched_tbl')
    console.log(tb)
    console.log(tb.rows[idx])
  }