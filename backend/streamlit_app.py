import streamlit as st
import requests
import json
import base64
from PIL import Image
import io
import time
from functools import lru_cache

# 配置页面
st.set_page_config(
    page_title="Noco - 视频标注与AI训练平台",
    page_icon="🎥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# 后端API基础URL
BASE_URL = "http://localhost:8888"

# 初始化session state
if 'user_id' not in st.session_state:
    st.session_state.user_id = None
if 'username' not in st.session_state:
    st.session_state.username = None
if 'current_project_id' not in st.session_state:
    st.session_state.current_project_id = None
if 'current_video_id' not in st.session_state:
    st.session_state.current_video_id = None

def make_request(endpoint, method="POST", data=None, files=None, params=None):
    """发送HTTP请求到后端API"""
    try:
        url = f"{BASE_URL}{endpoint}"
        if method == "POST":
            if files:
                response = requests.post(url, data=data, files=files, params=params)
            else:
                response = requests.post(url, json=data, params=params)
        else:
            response = requests.get(url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            st.error(f"请求失败: {response.status_code}")
            return None
    except requests.exceptions.ConnectionError:
        st.error("无法连接到后端服务器，请确保服务器正在运行")
        return None
    except Exception as e:
        st.error(f"请求出错: {str(e)}")
        return None

@st.cache_data(ttl=60)  # 缓存60秒
def get_project_name_cached(project_id):
    """缓存项目名称获取"""
    response = make_request("/get_project_details", data={
        "project_id": project_id
    })
    if response:
        return response.get("project name", f"项目 {project_id}")
    else:
        return f"项目 {project_id}"

def login_page():
    """登录页面"""
    st.title("🎥 Noco - 视频标注与AI训练平台")
    st.markdown("---")
    
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col2:
        st.subheader("用户登录")
        
        username = st.text_input("用户名", placeholder="请输入用户名", key="login_username")
        password = st.text_input("密码", type="password", placeholder="请输入密码", key="login_password")
        
        if st.button("登录", use_container_width=True, key="login_btn"):
                if username and password:
                    with st.spinner("正在登录..."):
                        response = make_request("/login", data={
                            "username": username,
                            "password": password
                        })
                        
                        if response and response.get("success"):
                            st.session_state.user_id = int(response.get("userID"))
                            st.session_state.username = username
                            st.success("登录成功！")
                            time.sleep(1)
                            st.rerun()
                        elif response:
                            st.error(response.get("message", "登录失败"))
                        else:
                            st.error("无法连接到服务器，请检查后端是否正在运行")
                else:
                    st.error("请输入用户名和密码")

def project_management_page():
    """项目管理页面"""
    st.title("📁 项目管理")
    st.markdown("---")
    
    # 侧边栏 - 项目操作
    with st.sidebar:
        st.subheader("项目操作")
        
        # 创建新项目
        with st.expander("创建新项目", expanded=True):
            project_name = st.text_input("项目名称", placeholder="输入项目名称", key="new_project_name")
            project_type = st.selectbox("项目类型", ["YOLO object detection"], key="new_project_type")
            
            if st.button("创建项目", use_container_width=True, key="create_project_btn"):
                    if project_name:
                        response = make_request("/create_project", data={
                            "userID": st.session_state.user_id,
                            "project_name": project_name,
                            "project_type": project_type
                        })
                        
                        if response and response.get("success"):
                            st.success("项目创建成功！")
                            st.rerun()
                        else:
                            st.error("项目创建失败")
                    else:
                        st.error("请输入项目名称")
        
        # 获取用户项目
        col1, col2 = st.columns([3, 1])
        with col1:
            st.subheader("我的项目")
        with col2:
            if st.button("🔄 刷新", use_container_width=True, key="refresh_projects_btn"):
                st.rerun()
        response = make_request("/get_projects_info", data={
            "userID": st.session_state.user_id
        })
        
        if response:
            owned_projects = response.get("owned projects", [])
            shared_projects = response.get("shared projects", [])
        else:
            owned_projects = []
            shared_projects = []
        
        if owned_projects:
            st.write("**我拥有的项目:**")
            for project_id in owned_projects:
                project_name = get_project_name_cached(project_id)
                if st.button(f"📁 {project_name}", key=f"owned_{project_id}"):
                    st.session_state.current_project_id = project_id
                    st.rerun()
        
        if shared_projects:
            st.write("**共享给我的项目:**")
            for project_id in shared_projects:
                project_name = get_project_name_cached(project_id)
                if st.button(f"📁 {project_name}", key=f"shared_{project_id}"):
                    st.session_state.current_project_id = project_id
                    st.rerun()
    
    # 主内容区域
    if st.session_state.current_project_id:
        # 显示项目详情
        response = make_request("/get_project_details", data={
            "project_id": st.session_state.current_project_id
        })
    
    if response:
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            st.metric("项目名称", response.get("project name", "未知"))
        with col2:
            st.metric("项目类型", response.get("project type", "未知"))
        with col3:
            st.metric("视频数量", response.get("video count", 0))
        with col4:
            status = response.get("status", "未知")
            status_color = {
                "Not started": "🔴",
                "Awaiting Labelling": "🟡", 
                "Labeling in progress": "🟡",
                "Data is ready": "🟢",
                "Training in progress": "🔵",
                "Trained": "🟢"
            }.get(status, "⚪")
            st.metric("项目状态", f"{status_color} {status}")
    else:
        st.error("无法获取项目详情")
    
    if st.session_state.current_project_id and response:
        # 项目操作按钮
        st.markdown("---")
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if st.button("📹 视频管理", use_container_width=True, key="video_management_btn"):
                st.session_state.page = "video_management"
                st.rerun()
        
        with col2:
            if st.button("🏷️ 开始标注", use_container_width=True, key="annotation_btn"):
                st.session_state.page = "annotation"
                st.rerun()
        
        with col3:
            if st.button("🤖 模型训练", use_container_width=True, key="training_btn"):
                st.session_state.page = "training"
                st.rerun()
    else:
        st.info("请从侧边栏选择一个项目")

def video_management_page():
    """视频管理页面"""
    st.title("📹 视频管理")
    st.markdown("---")
    
    if not st.session_state.current_project_id:
        st.error("请先选择一个项目")
        return
    
    # 视频上传
    st.subheader("上传视频")
    uploaded_file = st.file_uploader(
        "选择视频文件", 
        type=['mp4', 'mov', 'avi', 'webm', 'mkv'],
        help="支持格式: MP4, MOV, AVI, WebM, MKV"
    )
    
    if uploaded_file is not None:
        if st.button("上传视频", use_container_width=True, key="upload_video_btn"):
            with st.spinner("正在上传视频..."):
                files = {"file": (uploaded_file.name, uploaded_file, uploaded_file.type)}
                params = {"project_id": str(st.session_state.current_project_id)}
                
                response = make_request("/upload", files=files, params=params)
                
                if response:
                    st.success(f"视频上传成功！视频ID: {response.get('video_id')}")
                    st.rerun()
                else:
                    st.error("视频上传失败")
    
    # 显示已上传的视频
    st.subheader("已上传的视频")
    response = make_request("/get_uploaded_videos", data={
        "project_id": st.session_state.current_project_id
    })
    
    if response:
        videos = response
        if videos:
            for i, video in enumerate(videos):
                with st.expander(f"视频 {i+1}: {video.get('name', '未知名称')}"):
                    col1, col2 = st.columns([2, 1])
                    
                    with col1:
                        st.write(f"**文件路径:** {video.get('path', '未知')}")
                        st.write(f"**视频ID:** {video.get('file', '未知')}")
                    
                    with col2:
                        if st.button(f"选择此视频", key=f"select_video_{i}"):
                            st.session_state.current_video_id = video.get('file')
                            st.success("视频已选择")
        else:
            st.info("暂无上传的视频")
    else:
        st.error("还没上传视频")
    
    # 返回按钮
    if st.button("← 返回项目管理", use_container_width=True, key="back_to_projects_video"):
        st.session_state.page = "project_management"
        st.rerun()

def annotation_page():
    """标注页面"""
    st.title("🏷️ 视频标注")
    st.markdown("---")
    
    if not st.session_state.current_project_id:
        st.error("请先选择一个项目")
        return
    
    # 获取项目类别
    response = make_request("/get_classes", data={
        "project_id": st.session_state.current_project_id
    })
    
    if response and response.get("success"):
        classes = response.get("classes", {})
    else:
        classes = {}
    
    if not classes:
        st.warning("项目中没有定义类别，请先添加类别")
        
        # 添加类别
        with st.expander("添加新类别"):
            class_name = st.text_input("类别名称", key="new_class_name")
            color = st.color_picker("类别颜色", value="#FF0000", key="new_class_color")
            
            if st.button("添加类别", key="add_class_btn"):
                if class_name:
                    response = make_request("/add_class", data={
                        "project_id": st.session_state.current_project_id
                    }, params={
                        "class_name": class_name,
                        "colour": color
                    })
                    
                    if response and response.get("success"):
                        st.success("类别添加成功！")
                        st.rerun()
                    else:
                        st.error("类别添加失败")
    else:
        # 显示类别
        st.subheader("项目类别")
        cols = st.columns(len(classes))
        for i, (class_name, color) in enumerate(classes.items()):
            with cols[i]:
                st.markdown(f"<div style='background-color: {color}; padding: 10px; border-radius: 5px; text-align: center; color: white;'>{class_name}</div>", unsafe_allow_html=True)
        
        # 获取下一帧进行标注
        if st.session_state.current_video_id:
            # 初始化帧获取状态
            if 'frame_loaded' not in st.session_state:
                st.session_state.frame_loaded = False
            if 'current_frame_data' not in st.session_state:
                st.session_state.current_frame_data = None
            if 'current_frame_num' not in st.session_state:
                st.session_state.current_frame_num = None
            
            # 如果还没有加载帧，显示获取下一帧按钮
            if not st.session_state.frame_loaded:
                if st.button("获取下一帧", use_container_width=True, key="get_next_frame_btn"):
                    with st.spinner("正在获取下一帧..."):
                        response = make_request("/get_next_frame_to_annotate", data={
                            "project_id": st.session_state.current_project_id,
                            "video_id": st.session_state.current_video_id
                        })
                        
                        if response and response.get("success"):
                            # 保存帧数据到session state
                            st.session_state.current_frame_data = response.get("image")
                            st.session_state.current_frame_num = response.get("frame_num", 0)
                            st.session_state.frame_loaded = True
                            st.rerun()
                        else:
                            st.info("所有帧都已标注完成")
            
            # 如果已经加载了帧，显示标注界面
            if st.session_state.frame_loaded and st.session_state.current_frame_data:
                # 显示图像
                image_bytes = base64.b64decode(st.session_state.current_frame_data)
                image = Image.open(io.BytesIO(image_bytes))
                st.image(image, caption="当前帧", use_column_width=True)
                
                # 标注界面
                st.subheader("标注工具")
                st.info("这是一个简化的标注界面。在实际应用中，您需要实现更复杂的标注工具，如边界框绘制等。")
                
                # 简化的标注界面
                selected_class = st.selectbox("选择类别", list(classes.keys()))
                x = st.number_input("X坐标", min_value=0, value=100)
                y = st.number_input("Y坐标", min_value=0, value=100)
                width = st.number_input("宽度", min_value=1, value=50)
                height = st.number_input("高度", min_value=1, value=50)
                
                col1, col2 = st.columns(2)
                with col1:
                    if st.button("保存标注", use_container_width=True, key="save_annotation_btn"):
                        bbox = [selected_class, x, y, width, height]
                        response = make_request("/annotate", data={
                            "project_id": st.session_state.current_project_id,
                            "video_id": st.session_state.current_video_id,
                            "frame_num": st.session_state.current_frame_num,
                            "bboxes": [bbox]
                        })
                        
                        if response and response.get("success"):
                            st.success("标注保存成功！")
                            # 重置帧状态，准备获取下一帧
                            st.session_state.frame_loaded = False
                            st.session_state.current_frame_data = None
                            st.session_state.current_frame_num = None
                            st.rerun()
                        else:
                            st.error("标注保存失败")
                
                with col2:
                    if st.button("跳过此帧", use_container_width=True, key="skip_frame_btn"):
                        # 重置帧状态，准备获取下一帧
                        st.session_state.frame_loaded = False
                        st.session_state.current_frame_data = None
                        st.session_state.current_frame_num = None
                        st.rerun()
        else:
            st.warning("请先选择一个视频进行标注")
    
    # 如果无法获取类别信息，显示错误
    if not response:
        st.error("无法连接到服务器，请检查后端是否正在运行")
    
    # 返回按钮
    if st.button("← 返回项目管理", use_container_width=True, key="back_to_projects_annotation"):
        st.session_state.page = "project_management"
        st.rerun()

def training_page():
    """训练页面"""
    st.title("🤖 模型训练")
    st.markdown("---")
    
    if not st.session_state.current_project_id:
        st.error("请先选择一个项目")
        return
    
    # 获取项目状态
    response = make_request("/get_project_details", data={
        "project_id": st.session_state.current_project_id
    })
    
    if response:
        status = response.get("status", "未知")
    else:
        st.error("无法获取项目状态")
        return
    
    if status == "Data is ready":
        st.success("✅ 数据已准备就绪，可以开始训练")
        
        if st.button("🚀 开始训练", use_container_width=True, key="start_training_btn"):
            with st.spinner("正在启动训练..."):
                response = make_request("/train", data={
                    "project_id": st.session_state.current_project_id
                })
                
                if response and response.get("success"):
                    st.success("训练已开始！")
                    st.info("训练在后台进行，请稍后查看进度")
                else:
                    st.error("训练启动失败")
    
    elif status == "Training in progress":
        st.info("🔄 训练正在进行中...")
        
        # 显示训练进度
        if st.button("刷新训练进度", use_container_width=True, key="refresh_training_btn"):
            response = make_request("/get_training_progress", data={
                "project_id": st.session_state.current_project_id
            })
            
            if response and response.get("success"):
                progress = response.get("progress", 0)
                st.progress(progress / 100)
                st.write(f"训练进度: {progress}%")
            else:
                st.error("无法获取训练进度")
    
    elif status == "Trained":
        st.success("✅ 模型训练完成！")
        
        # 显示模型性能
        if st.button("查看模型性能", use_container_width=True, key="view_performance_btn"):
            response = make_request("/get_model_performance", data={
                "project_id": st.session_state.current_project_id
            })
            
            if response and response.get("success"):
                performance = response.get("model performance", {})
                
                col1, col2, col3, col4 = st.columns(4)
                
                with col1:
                    st.metric("准确率", f"{performance.get('accuracy', 0):.3f}")
                with col2:
                    st.metric("精确率", f"{performance.get('precision', 0):.3f}")
                with col3:
                    st.metric("召回率", f"{performance.get('recall', 0):.3f}")
                with col4:
                    st.metric("F1分数", f"{performance.get('f1-score', 0):.3f}")
            else:
                st.error("无法获取模型性能")
        
        # 获取模型路径
        if st.button("获取模型路径", use_container_width=True, key="get_model_path_btn"):
            response = make_request("/get_model_path", data={
                "project_id": st.session_state.current_project_id
            })
            
            if response and response.get("success"):
                model_path = response.get("model path")
                st.success(f"模型路径: {model_path}")
            else:
                st.error("无法获取模型路径")
    
    else:
        st.warning(f"当前状态: {status}")
        st.info("请先完成数据标注，然后创建数据集")
        
        if st.button("创建数据集", use_container_width=True, key="create_dataset_btn"):
            with st.spinner("正在创建数据集..."):
                response = make_request("/create_dataset", data={
                    "project_id": st.session_state.current_project_id
                })
                
                if response and response.get("success"):
                    st.success("数据集创建已开始！")
                else:
                    st.error("数据集创建失败")
    
    # 返回按钮
    if st.button("← 返回项目管理", use_container_width=True, key="back_to_projects_training"):
        st.session_state.page = "project_management"
        st.rerun()

def main():
    """主函数"""
    # 检查是否已登录
    if st.session_state.user_id is None:
        login_page()
    else:
        # 显示用户信息和登出按钮
        col1, col2 = st.columns([3, 1])
        with col1:
            st.write(f"欢迎, {st.session_state.username}!")
        with col2:
            if st.button("登出"):
                st.session_state.user_id = None
                st.session_state.username = None
                st.session_state.current_project_id = None
                st.session_state.current_video_id = None
                st.rerun()
        
        # 页面导航
        if 'page' not in st.session_state:
            st.session_state.page = "project_management"
        
        # 侧边栏导航
        with st.sidebar:
            st.markdown("## 导航")
            if st.button("📁 项目管理", use_container_width=True, key="nav_projects_btn"):
                st.session_state.page = "project_management"
                st.rerun()
            if st.button("📹 视频管理", use_container_width=True, key="nav_video_btn"):
                st.session_state.page = "video_management"
                st.rerun()
            if st.button("🏷️ 标注工具", use_container_width=True, key="nav_annotation_btn"):
                st.session_state.page = "annotation"
                st.rerun()
            if st.button("🤖 模型训练", use_container_width=True, key="nav_training_btn"):
                st.session_state.page = "training"
                st.rerun()
        
        # 根据当前页面显示内容
        if st.session_state.page == "project_management":
            project_management_page()
        elif st.session_state.page == "video_management":
            video_management_page()
        elif st.session_state.page == "annotation":
            annotation_page()
        elif st.session_state.page == "training":
            training_page()

if __name__ == "__main__":
    main()
