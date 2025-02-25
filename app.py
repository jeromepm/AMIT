from flask import Flask, render_template, send_file, url_for, request, session, redirect, send_from_directory, after_this_request
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from werkzeug.utils import secure_filename
from pytz import common_timezones
from dotenv import load_dotenv
from datetime import datetime
import numpy as np
import operator
import shutil
import pickle
import json
import cv2
import os
import re

load_dotenv()

# Example Pickle File
# 'name': '',
# 'description': '',
# 'labels': ['Nothing', 'a', 'b'],
# 'created': epoch,
# 'last_updated': epoch,
# 'directories': [ {'name': '','location': '','control': False,'backup': False,'review': False}}]
# 'label_data': [ {'file': '', 'labels' [0,1,1] }]
PORT = os.environ['PORT']
TZ = os.environ['TIMEZONE']
DATA_DIR = 'data/data_files/'
REVIEW_DIR = 'data/review_images'

scheduler = BackgroundScheduler(timezone=TZ)
scheduler.start()

def get_images(urls:list[str]):
    for entry in urls:
        data = entry.split('::')
        data[0] = data[0].replace(' ','_')
        print(data)
        ts = int(datetime.now().timestamp())
        img = False
        if 'rtsp' in data[3]:
            cap = cv2.VideoCapture(data[3])
            if not cap.isOpened():
                continue
            try:
                res, img = cap.read()
                print('Read image in RTSP')
            except Exception as e:\
                print(f'Error RTSP: \r\n{e}')
            finally:
                cap.release()
        else:
            try:
                img = cv2.imread(data[3])
            except Exception as e:
                continue
        height, width, channels = img.shape
        if height > width:
            img = cv2.resize(img, (720, 1280))
        else:
            img = cv2.resize(img, (1280, 720)) 
        cv2.imwrite(f'{REVIEW_DIR}/{data[0]}/image_0{data[1]}-{ts}.jpg', img)
        print("\r\nTask executed!")

def get_project(file)->dict:
    if os.path.isfile(f'{DATA_DIR}{file}'):
        with open(f'{DATA_DIR}{file}', 'rb') as f:
            p = pickle.load(f)
    else:
        p = {'doesnt_exist': True}
    return p

def save_project(data, file):
    data['last_updated'] = int(datetime.now().timestamp())
    with open(f'{DATA_DIR}{file}', 'wb') as f:
        pickle.dump(data, f, protocol=pickle.HIGHEST_PROTOCOL)
        print(f"Updated {file}")
    del data

def all_projects()->list:
    projects = os.listdir(DATA_DIR)
    projects = [f for f in projects if f.endswith('.pkl')]
    res = []
    for p in projects:
        with open(f'{DATA_DIR}{p}', 'rb') as file:
            project = pickle.load(file)
        o = {}
        o['File'] = p
        o['Project Name'] = project['name']
        o['Project Description'] = project['description']
        o['No of Labels'] = len(project['labels'])
        o['No of Sources'] = len(project['sources'])
        o['First Created'] = datetime.utcfromtimestamp(int(project['created'])).strftime('%Y-%m-%d')
        o['Last Updated'] = datetime.utcfromtimestamp(int(project['last_updated'])).strftime('%Y-%m-%d')
        res.append(o)
    return res

def all_sources()->list:
    projects = os.listdir(DATA_DIR)
    projects = [f for f in projects if f.endswith('.pkl')]
    res = []
    for p in projects:
        with open(f'{DATA_DIR}{p}', 'rb') as file:
            project = pickle.load(file)
        o = {'project': project['name'],'sources' : project['sources'] }
        res.append(o)
    return res

def blank_lables(label_names:list[str])->list[int]:
    label_set = []
    for n in label_names:
        label_set.append(0)
    return label_set

def get_chart(names:list,values:list, title:str):
    data = {}
    data['labels'] = names
    data['datasets'] = [{'data' : values}]
    o = {'title' : title}
    o['data'] = data
    return json.dumps(o)

def get_jpgfiles(filedir):
    dir_list = os.listdir(filedir)
    files = [f for f in dir_list if os.path.isfile(filedir+'/'+f) and f.endswith('.jpg')]
    files.sort()
    return files

app = Flask(__name__)

@app.route('/')
def main():
    projects = all_projects()
    if len(projects) == 0:
        return render_template("index.html", tz=TZ, tzs=common_timezones)
    if 'pro' in request.args and request.args.get("pro") != '':
        project = get_project(request.args.get("pro"))
        if 'doesnt_exist' in project:
            return render_template("index.html", tz=TZ, tzs=common_timezones, projects=projects)
    else:
        return render_template("index.html", tz=TZ, tzs=common_timezones, projects=projects)
    if "a" in request.args:
        if request.args.get("a") == "conf":
            return_list = blank_lables(project['labels'])
            image_dir = [d for d in project['directories'] if d['control'] == False and d['backup'] == False and d['review'] == False][0]
            file_list = get_jpgfiles(image_dir['location'])

            complete = [ d for d in project['label_data'] if d['labels'] != return_list ]
            incomplete = [ d for d in project['label_data'] if d['labels'] == return_list ]
            for entry in project['label_data']:
                for i,n in enumerate(entry['labels']):
                    return_list[i] += int(n)
            cam_names = []
            cam_values = []
            for cam in project['sources']:
                cam_names.append(cam['location'])
                count = len([ d for d in project['label_data'] if d['file'].startswith(f'image_0{cam["id"]}') ])
                cam_values.append(count)
            byLabelJSON = get_chart(project['labels'],return_list,'Label Count by Names')
            byImageJSON = get_chart(cam_names,cam_values,"Image Count By Camera")
            data_obj = {}
            mv_dirs = []
            for d in project['directories']:
                mv_dirs.append({'name' : d["name"].replace('_',' ').title(),
                 'location': d['location'].split('/')[-1]})
                files = get_jpgfiles(d['location'])
                data_obj[f'Total in {d["name"]} directory'] = len(files)
            data_obj[f'Total files that need labeles'] = len(incomplete)
            data_obj[f'Total files that are labeled'] = len(complete)
            image_dir['location'] = image_dir['location'].split('/')[-1]
            return render_template("index.html", act='conf', tz=TZ, project=request.args.get("pro"), label_images = file_list, image_dir=image_dir,
                    tzs=common_timezones,  mv_dirs=mv_dirs, byLabelGraph=byLabelJSON, byImageGraph=byImageJSON, data=data_obj, sources = project['sources'])
        elif request.args.get("a") == "mv":
            dirs = [e['name'].replace('_',' ').replace('with','should').replace('labels','label').title() for e in project['directories']]
            d_locations = [e['location'].split('/')[-1] for e in project['directories']]
            rev_dir = [d for d in project['directories'] if d['review'] == True][0]
            if 'f' in request.args:
                file = request.args.get("f")
                rev_dir['location'] = rev_dir['location'].split('/')[-1]
                return render_template("index.html", project=request.form.get("project") ,act='mv', tz=TZ, tzs=common_timezones, rev_dir=rev_dir,
                    dirs=dirs,d_locations=d_locations,rvw_image=file)
            else:
                reviewfiles = get_jpgfiles(rev_dir['location'])
                if len(reviewfiles) == 0:
                    filelist = [f['file'] for f in project['label_data']]
                    image = project['label_data'][0]['file']
                    label_n = project['label_data'][0]['labels']
                    idx = 0
                    labels = []
                    for i,l in enumerate(label_n):
                        labels.append({'name': project['labels'][i], 'checked': l})
                        rev_dir['location'] = rev_dir['location'].split('/')[-1]                
                    return render_template("index.html", project=request.args.get("pro"), act='cat', tz=TZ, tzs=common_timezones,rev_dir=rev_dir,
                        c_image=image, c_labels=labels, idx=idx, filelist=filelist, total_images=(len(filelist)-1))
                else:
                    rev_dir['location'] = rev_dir['location'].split('/')[-1]
                    return render_template("index.html", act='mv', project=request.args.get("pro"), tz=TZ, tzs=common_timezones,rev_dir=rev_dir,
                        dirs=dirs,d_locations=d_locations,rvw_image=reviewfiles[0])
        elif request.args.get("a") == "cat":
            file = request.args.get("f")
            idx = request.args.get("n")
            img_dir = [d for d in project['directories'] if d['control'] == False and d['backup'] == False and d['review'] == False][0]
            img_dir['location'] = img_dir['location'].split('/')[-1]
            filelist = [ f['file'] for f in project['label_data'] ]
            if file == None:
                image = project['label_data'][0]['file']
                label_n = project['label_data'][0]['labels']
                idx = 0
                for i,s in enumerate(project['label_data']):
                    if s['labels'] == [0,0,0,0]:
                        image = s['file']
                        label_n = s['labels']
                        idx = i
                        break
                labels = []
                for i,l in enumerate(label_n):
                        labels.append({'name': project['labels'][i], 'checked': l})
                return render_template("index.html", project=request.args.get("pro"), act='cat', tz=TZ, tzs=common_timezones, img_dir=img_dir,
                        c_image=image, c_labels=labels, idx=idx, filelist=filelist, total_images=(len(filelist)-1))
            for entry in project['label_data']:
                if entry['file'] == file:
                     #print(entry)
                    labels = []
                    #print(entry['labels'])
                    for i,l in enumerate(entry['labels']):
                            labels.append({'name': project['labels'][i], 'checked': l})
                    return render_template("index.html", project=request.args.get("pro"), act='cat', tz=TZ, tzs=common_timezones, img_dir=img_dir,
                            c_image=entry['file'], c_labels=labels, idx=idx, filelist=filelist, total_images=(len(filelist)-1))
        elif request.args.get("a") == "sched":
            schedules = scheduler.get_jobs()
            sch = []
            if len(schedules) > 0:
                for s in schedules:
                    o = {'name' : s.name }
                    o['id'] = s.id
                    trigger_data = re.search("day_of_week=\'(.*)\',\shour=\'(.*)\',\sminute=\'(.*)\',\s", str(s.trigger))
                    if trigger_data.group(1) == '*':
                        dow = 'Every Day'
                    else:
                        dow = f'{trigger_data.group(1)}'
                        if '0' in dow:
                            dow = dow.replace('0','Mon').replace('1','Tues')
                        if '1' in dow:
                            dow = dow.replace('1','Tues')
                        if '2' in dow:
                            dow = dow.replace('2','Wed')
                        if '3' in dow:
                            dow = dow.replace('3','Thurs')
                        if '4' in dow:
                            dow = dow.replace('4','Fri')
                        if '5' in dow:
                            dow = dow.replace('5','Sat')
                        if '6' in dow:
                            dow = dow.replace('6','Sun')
                        dow = dow.split(',')
                    freq = None
                    times = None
                    hod = f'{trigger_data.group(2)}'
                    mod = f'{trigger_data.group(3)}'
                    print(f'\n\nHour of Day : {hod}\nMinute of Day: {mod}')
                    #If the slash is in the hour of day than the frequency is every N hour
                    if '/' in hod:
                        freq = f"Every {hod.split('/')[1]} hour"
                        hod = hod.split('/')[0]
                    #If the slash is in the minute of day than the frequency is every N minutes
                    if '/' in mod:
                        freq = f"Every {mod.split('/')[1]} min"
                    elif mod == '0':
                        freq = 'Every hour'
                    elif mod == '*':
                        freq = 'Every minute'
                    #If the star is in the hour of day than it's all day                      
                    if hod == '*':
                        times = 'All Day'
                    else:
                        hod = hod.split('-')
                        if hod[0] == '0':
                            strt_time = 'Midnight'
                        elif hod[0] == '12':
                            strt_time = 'Noon'
                        elif int(hod[0]) > 12:
                            strt_time = f'{int(hod[0]) - 12}:00 PM'
                        else:
                            strt_time = f'{hod[0]}:00 AM'
                        if hod[1] == '0':
                            end_time = 'Midnight'
                        elif hod[1] == '12':
                            end_time = 'Noon'
                        elif int(hod[1]) > 12:
                            end_time = f'{int(hod[1]) - 12}:00 PM'
                        else:
                            end_time = f'{hod[1]}:00 AM'
                        times = f"{strt_time} to {end_time}"
                    t = {'day_of_week' : dow, 'times_of_day' : times, 'frequency' : freq}
                    print(t)
                    o['trigger'] = t 
                    srcs = []
                    print('\r\n\nGetting Sources')
                    for src in s.args[0]:
                        src = src.split('::')
                        srcs.append({'project' : src[0], 'location': src[2]})                        
                    o['sources'] = srcs
                    sch.append(o)
            sources = all_sources()
            #print(sources)
            if "pro" in request.args:
                return render_template("index.html", tz=TZ, tzs=common_timezones, project=request.args.get("pro"),
                sources=sources, schedules=sch, act='sched')
            else:
                return render_template("index.html", tz=TZ, tzs=common_timezones,
                sources=sources, schedules=sch, act='sched')
    return render_template("index.html", tz=TZ, tzs=common_timezones, projects=projects)

#@app.route('/review/<path:filename>')
#def review_file(filename):
#    print(request.args.get('pro'))
#    project = get_project(request.args.get('pro'))
#    review_folder =[e['location'] for e in project['directories'] if e['review'] == True][0]
#    return send_from_directory(review_folder,filename)

@app.route('/verify', methods=["POST"])
def verify():
    if 'rtsp' in request.json['url']:
        cap = cv2.VideoCapture(request.json['url'])
        if not cap.isOpened():
            return 'error'
        try:
            #r = urllib.request.urlopen(request.json['url'], timeout = 2)
            res, frame = cap.read()
            if res:
                return 'ok'
            else:
                return 'error'
        except Exception as e:
            return 'error'
        finally:
            return 'error'
    else:
        print(f"Trying to real {request.json['url']} as a URL with CV2")
        try:
            cv2.imread(request.json['url'])
        except Exception as e:
            return 'error'
        finally:
            return 'error'

@app.route('/project/<path:action>', methods=["POST"])
def project(action):
    if action == 'create':
        ts = int(datetime.now().timestamp())
        os.makedirs(f"data/review_images/{request.form.get('pname').replace(' ', '_')}/", exist_ok = True)
        os.makedirs(f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/", exist_ok = True)
        os.makedirs(f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/{request.form.get('ctrl_name')}/", exist_ok = True)
        os.makedirs(f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/labels/", exist_ok = True)
        os.makedirs(f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/backup_{request.form.get('ctrl_name')}/", exist_ok = True)
        os.makedirs(f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/backup_labels/", exist_ok = True)
        pro_pkl = {}
        pro_pkl['name'] = request.form.get('pname')
        pro_pkl['description'] = request.form.get('pdescr')
        pro_pkl['labels'] = [request.form.get('ctrl_name')] + request.form.get('lnames').split(',')
        pro_pkl['created'] = ts
        pro_pkl['last_updated'] = ts
        pro_pkl['directories'] = [ {'name' : 'review', 'location' : f"data/review_images/{request.form.get('pname').replace(' ', '_')}", 'control' : False, 'backup' : False, 'review': True},
                                   {'name' : request.form.get('ctrl_name'), 'location' : f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/{request.form.get('ctrl_name')}",'control' : True, 'backup' : False, 'review': False},
                                   {'name' : 'with_labels', 'location' : f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/labels", 'control' : False, 'backup' : False, 'review': False},
                                   {'name' : f"backup_{request.form.get('ctrl_name')}", 'location' : f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/backup_{request.form.get('ctrl_name')}",'control' : False, 'backup' : True, 'review': False},
                                   {'name' : 'backup_with_labels', 'location' : f"data/labeling_images/{request.form.get('pname').replace(' ', '_')}/backup_labels", 'control' : False, 'backup' : True, 'review': False}
                                 ]
        pro_pkl['sources'] = []
        if request.form.get('sources_enabled') != None:
            for i,e in enumerate(request.form.getlist('slocation')):
                pro_pkl['sources'].append({'name': f'camera0{i}', 'id': i, 'location': e, 'type' : request.form.getlist('stype')[i], 'url' : request.form.getlist('surl')[i] })
        pro_pkl['label_data'] = [] 
        save_project(pro_pkl, f"{request.form.get('pname').replace(' ', '_')}_{ts}.pkl")


        if request.form.get('fname') == None:
            return redirect(f"/", code=302)
    if action == 'select':
        project = get_project(file)

    return render_template("index.html", tz=TZ)

# Example Pickle File
# 'name': '',
# 'description': '',
# 'labels': ['Nothing', 'a', 'b'],
# 'created': epoch,
# 'last_updated': epoch,
# 'directories': [ {'name': '','location': '','control': False,'backup': False,'review': False}}]
# 'label_data': [ {'file': '', 'labels' [0,1,1] }]
@app.route('/schedule/<path:action>', methods=["POST"])
def schedule(action):
    if action == 'create':
        #print(f"Image Sources: \r\n{request.form.getlist('image_source')}\r\n")
        #get_images(request.form.getlist('image_source'))
        if 'every_day' in request.form.keys():
            day='*'
        elif len(request.form.getlist('day_of_week')) > 1:
            day=','.join(str(m) for m in request.form.getlist('day_of_week'))
        else:
            day=str(request.form.get('day_of_week'))
        #print(day)

        if 'all_day' in request.form.keys():
            hour='*'
        else:
            s_hour = request.form.get('strt_hr') if request.form.get('strt_12hrap') == 'AM' else int(request.form.get('strt_hr')) + 12
            e_hour = request.form.get('end_hr') if request.form.get('end_12hrap') == 'AM' else int(request.form.get('end_hr')) + 12
            hour=f"{s_hour}-{e_hour}"
        #print(hour)
        freq = request.form.get('freq')
        if (freq[-1] == 'm'):
            minute = f"*/{freq[:-1]}" if freq[:-1] != '1' else '*'
        elif (freq[-1] == 'h'):
            minute = '00'
        trigger = CronTrigger(
            year="*", month="*", day_of_week=day, hour=hour, minute=minute, second="0"
        )
        scheduler.add_job(
            get_images,
            trigger=trigger,
            args=[request.form.getlist('image_source')],
            name=request.form.get('schname'),
        )
    elif action == 'delete':
        r = scheduler.remove_job(request.form.get('sch_id'))
    if 'pro' in request.args:
        return redirect(f"/?pro={request.form.get('project')}&?a=sched")
    else:
        return redirect(f"/?a=sched")

@app.route('/act/<path:action>', methods=["POST"])
def label_buttons(action):
    project = get_project(request.form.get('project'))
    if 'doesnt_exist' in project:
        return redirect(f"/?pro={request.form.get('project')}", code=302)
    if action == 'submit':
        for i,entry in enumerate(project['label_data']):
            if entry['file'] == request.form.get('fname'):
                for j in request.form.getlist('labels'):
                    j = int(j)-1
                    entry['labels'][j] = 1
                save_project(project, request.form.get('project'))
                if i+1 >= len(project['label_data']):
                    n = 0
                else:
                    n = i+1
                f = project['label_data'][n]['file']
                return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n={n}", code=302)
    if action == 'loadnew':
        file_path = [p['location'] for p in project['directories'] if p['control'] == False and p['backup'] == False and p['review'] == False][0]
        all_files = get_jpgfiles(file_path)
        filelist = [f['file'] for f in project['label_data']]
        #Elements in all_files but not in filelist
        new_files = list(set(all_files) - set(filelist))
        for file in new_files:
            project['label_data'].append({'file' : file, 'labels':blank_lables(project['labels'])})
        project['label_data'].sort(key=operator.itemgetter('file'))
        save_project(project, request.form.get('project'))     
    if action == 'startover':
        f = project['label_data'][0]['file']
        return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n=0", code=302)
    if action == 'nextset':
        x = int(re.search(r"image_0(\d)", request.form.get('fname')).groups()[0]) if re.search(r"image_0(\d)", request.form.get('fname')) != None else -1
        if x == -1:
            f = project['label_data'][0]['file']
            return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n=0", code=302)
    for i,entry in enumerate(project['label_data']):
        if action == 'nextset':
            y = int(re.search(r"image_0(\d)", entry['file']).groups()[0]) if re.search(r"image_0(\d)", entry['file']) != None else -1
            if isinstance(y, str):
                f = project['label_data'][0]['file']
                return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n=0", code=302)
            if x < y  or entry['labels'] == blank_lables(project['labels']) or y == -1 or entry['labels'][0] == 1:
                f = entry['file']
                return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n={i}", code=302)
        if action == 'next_empty':
            if entry['labels'] == blank_lables(project['labels']):
                f = entry['file']
                return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n={i+1}", code=302)
        if entry['file'] == request.form.get('fname') and action in ['next','previous']:
            if action == 'next':
                if i + 1 >= len(project['label_data']):
                    break
                else:
                    i = i + 1
                    f = project['label_data'][i]['file']
            if action == 'previous':
                if i - 1 < 0:
                    break
                else:
                    i = i - 1
                    f = project['label_data'][i]['file']
            return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n={i}", code=302)
    f = project['label_data'][0]['file']
    return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n=0", code=302)

@app.route('/mv/<path:folder>', methods=["POST"])
def move_file(folder):
    project = get_project(request.form.get('project'))
    if 'doesnt_exist' in project:
        return redirect(f"/?pro={request.form.get('project')}", code=302)    
    cur_folder =request.form.get('cur_img_dir')

    if folder in request.form.get('project'):
        new_folder = f'{REVIEW_DIR}/{folder}'
    else:
        new_folder = [e['location'] for e in project['directories'] if e['location'].endswith(folder)][0]

    if cur_folder in request.form.get('project'):
        cur_folder = f'{REVIEW_DIR}/{cur_folder}'
    else:
        cur_folder = [e['location'] for e in project['directories'] if e['location'].endswith(cur_folder)][0]

    mv_file = request.form.get('mv_fname')
    print(f"{cur_folder}/{mv_file}", f"{new_folder}/{mv_file}")
    
    if cur_folder != new_folder:
        shutil.move(f"{cur_folder}/{mv_file}", f"{new_folder}/{mv_file}")
        if folder == 'labels':
            project['label_data'].append({'file' : mv_file, 'labels' : blank_lables(project['labels'])})
            save_project(project, request.args.get('pro'))
        if cur_folder == 'labels':
            entry = [e for e in project['label_data'] if e['file'] == mv_file][0]
            project['label_data'].remove(entry)
            save_project(project, request.args.get('pro'))
    review_files = get_jpgfiles(cur_folder)
    if len(review_files) == 0:
        return redirect(f"/?pro={request.form.get('project')}&a=cat", code=302)
    else:
        return redirect(f"/?pro={request.form.get('project')}&a=mv&f={review_files[0]}&n=0", code=302)

@app.route('/select_folder/<path:folder>', methods=["POST"])
def select_folder(folder):
    project = get_project(request.form.get('project'))
    if 'doesnt_exist' in project:
        return redirect(f"/?pro={request.form.get('project')}", code=302)
    new_folder = request.form.get('new_folder')
    if (project['name'] in new_folder):
        full_loc = f'{REVIEW_DIR}/{new_folder}'
    else:
        full_loc = [d['location'] for d in project['directories'] if d['location'].endswith(new_folder)][0]
    files = get_jpgfiles(full_loc)
    return json.dumps({'path' : full_loc.split('/')[-1], 'files': files})

@app.route('/img/<path:folder>/<path:image_name>') 
def send_img(folder, image_name):
    if 'pro' in request.args:
        project = get_project(request.args.get("pro"))
        if 'doesnt_exist' in project:
            return redirect(f"/?pro={request.form.get('project')}", code=302)        
        if folder in project['name'].replace(' ','_'):
            path = f'{REVIEW_DIR}/{folder}'
        else:
            path = [d['location'] for d in project['directories'] if d['location'].endswith(folder)][0]
        return send_from_directory(path,image_name)

@app.route('/delete', methods=["POST"])
def delete():           
    project = get_project(request.form.get('project'))
    if 'doesnt_exist' in project:
        return redirect(f"/?pro={request.form.get('project')}", code=302)    
    cur_folder = request.form.get('cur_img_dir')
    del_file = request.form.get('del_fname')
    if cur_folder in request.form.get('project'):
        cur_folder = f'{REVIEW_DIR}/{cur_folder}'
    else:
        cur_folder = [e['location'] for e in project['directories'] if e['location'].endswith(cur_folder)][0]
    try:
        os.remove(f"{cur_folder}/{del_file}")
    except OSError:
        pass
    if request.form.get('cur_img_dir') == 'labels':
        for i,entry in enumerate(project['label_data']):
            if entry['file'] == del_file:
                project['label_data'].remove(entry)
                save_project(project, request.form.get('project'))
                break
        project = get_project(request.form.get('project'))
        if i + 1 >= len(project['label_data']):
            i = 0
        f = project['label_data'][i]['file']
        return redirect(f"/?pro={request.form.get('project')}&a=cat&f={f}&n={i}", code=302)
    else:
        return 'ok'


@app.route('/download', methods=["POST"])
def download():
    @after_this_request
    def delete_pkl(response):
        try:
            os.remove(request.form.get('project'))
        except Exception as ex:
            print(ex)
        return response 
    project = get_project(request.form.get('project'))
    if request.form.get('image_include') == 'y':
        img_dir = [d['location'] for d in project['directories'] if d['control'] == False and d['backup'] == False and d['review'] == False][0]
        for entry in project['label_data']:
            f = os.path.join(img_dir, entry['file'])
            if os.path.isfile(f):
                im = cv2.imread(f)
                im = cv2.resize(im, (224, 224))
                x = np.asarray(im)
                entry['numpy_image'] = x


    if request.form.get('control_include') == 'y':
        control_dir = [d['location'] for d in project['directories'] if d['control'] == True][0]
        control_files = os.listdir(control_dir)
        control_files = [f for f in control_files if f.endswith('.jpg')]
        control_files = [f for f in control_files if f.startswith('image_')]
        labels = []
        for i in range(len(project['labels'])-1):
            labels.append(0)
        labels.insert(0,1)
        for filename in control_files:
            f = os.path.join(control_dir, filename)
            if os.path.isfile(f):
                if request.form.get('image_include') == 'y':
                    im = cv2.imread(f)
                    im = cv2.resize(im, (224, 224))
                    x = np.asarray(im)
                    entry['numpy_image'] = x
                    project['label_data'].append({'file' : filename, 'labels' : labels, 'numpy_image' : x})
                else:
                    project['label_data'].append({'file' : filename, 'labels' : labels})

    with open(request.form.get('project'), 'wb') as f:
        pickle.dump(project, f, protocol=pickle.HIGHEST_PROTOCOL)
        print(f"Download file {request.form.get('project')} ready")
    return send_file(request.form.get('project'), download_name=request.form.get('project'))


@app.route('/upload/<path:folder>', methods=['POST']) 
def upload(folder): 
    if request.method == 'POST':
        project = get_project(request.form.get('project'))
        dir_ = [d['location'] for d in project['directories'] if d['location'].split('/')[-1]  == folder][0]
  
        # Get the list of files from webpage 
        images = request.files.getlist("image") 
  
        # Iterate for each file in the files List, and Save them 
        for file in images: 
            file.save(os.path.join(dir_, secure_filename(file.filename)))
            if folder == 'labels':
                project['label_data'].append({'file' : file, 'labels' : blank_lables(project['labels'])})
        if folder == 'labels':
            save_project(project, request.form.get('project'))
        return 'ok'

if(__name__ == "__main__"):
    app.run(host="0.0.0.0", port=PORT, debug=True)