
import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, FlatList, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const RATINGS = ["D","E","C","B","A","S","SS"];
const POINTS = { D:1, E:2, C:3, B:4, A:6, S:10, SS:25 };

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [expected, setExpected] = useState('C');
  const [groups, setGroups] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [currentGroupCode, setCurrentGroupCode] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const t = await AsyncStorage.getItem('tasks_v1');
      const g = await AsyncStorage.getItem('groups_v1');
      if (t) setTasks(JSON.parse(t));
      if (g) setGroups(JSON.parse(g));
    } catch (e) {
      console.log(e);
    }
  }

  async function saveTasks(newTasks) {
    setTasks(newTasks);
    await AsyncStorage.setItem('tasks_v1', JSON.stringify(newTasks));
  }

  function addTask() {
    if (!title.trim()) return Alert.alert('خطأ','اكتب عنوان المهمة');
    const id = Date.now().toString();
    const task = { id, title, expected, status: 'pending', actual: null, points: 0, groupCode: currentGroupCode || null, createdAt: Date.now() };
    const nt = [task, ...tasks];
    saveTasks(nt);
    setTitle('');
  }

  function completeTask(t) {
    // show options to pick actual rating
    Alert.alert(
      "تقييم المهمة",
      `اختر التقييم الفعلي للمهمة "${t.title}"`,
      RATINGS.map(r => ({ text: r, onPress: () => confirmComplete(t, r) })).concat({ text: 'إلغاء', style: 'cancel' })
    );
  }

  async function confirmComplete(t, rating) {
    const pts = POINTS[rating] || 0;
    const nt = tasks.map(item => item.id === t.id ? { ...item, status: 'done', actual: rating, points: pts } : item);
    await saveTasks(nt);
  }

  function renderItem({ item }) {
    return (
      <View style={styles.task}>
        <View style={{flex:1}}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>توقع: {item.expected} - فعلي: {item.actual || '-'}</Text>
        </View>
        <View style={{alignItems:'flex-end'}}>
          <Text style={[styles.points, {color: item.points ? '#2b8a3e' : '#555'}]}>{item.points ? item.points + ' pts' : ''}</Text>
          {item.status === 'pending' ? (
            <TouchableOpacity onPress={() => completeTask(item)} style={styles.btn}>
              <Text style={styles.btnText}>إنهاء</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{color:'#888', marginTop:8}}>مُنهي</Text>
          )}
        </View>
      </View>
    );
  }

  function totalPoints() {
    return tasks.reduce((s,t)=> s + (t.points||0), 0);
  }

  function createGroup() {
    if (!groupName.trim()) return Alert.alert('خطأ','اكتب اسم المجموعة');
    const code = Math.random().toString(36).slice(2,8).toUpperCase();
    const g = { id: Date.now().toString(), name: groupName, code, members: [], createdAt: Date.now() };
    const ng = [g, ...groups];
    setGroups(ng);
    AsyncStorage.setItem('groups_v1', JSON.stringify(ng));
    Alert.alert('تم إنشاء المجموعة', `رمز الدعوة: ${code}`);
    setGroupName('');
  }

  function joinGroupByCode() {
    if (!currentGroupCode.trim()) return Alert.alert('ادخل رمز المجموعة');
    const g = groups.find(x => x.code === currentGroupCode.trim().toUpperCase());
    if (!g) return Alert.alert('رمز غير صحيح');
    // simple join: add "You" as member if not exists
    if (!g.members.includes('You')) {
      g.members.push('You');
      const ng = groups.map(x => x.id===g.id ? g : x);
      setGroups(ng);
      AsyncStorage.setItem('groups_v1', JSON.stringify(ng));
    }
    Alert.alert('تم الانضمام', `انضممت الى ${g.name}`);
    setCurrentGroupCode('');
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Text style={styles.header}>تطبيق المهام اليومية - تجريبي</Text>

      <View style={styles.row}>
        <TextInput placeholder="عنوان المهمة" value={title} onChangeText={setTitle} style={styles.input} />
        <TouchableOpacity style={styles.addBtn} onPress={addTask}><Text style={{color:'#fff'}}>إضافة</Text></TouchableOpacity>
      </View>

      <View style={styles.rowSmall}>
        <Text style={{marginRight:8}}>توقع التقييم:</Text>
        {RATINGS.map(r=> (
          <TouchableOpacity key={r} onPress={()=>setExpected(r)} style={[styles.rateBtn, expected===r && styles.rateBtnSel]}>
            <Text style={{color: expected===r ? '#fff' : '#333'}}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المهام</Text>
        <FlatList data={tasks} keyExtractor={i=>i.id} renderItem={renderItem} ListEmptyComponent={<Text style={{color:'#666'}}>لا توجد مهام</Text>} />
      </View>

      <View style={styles.footer}>
        <Text>مجموع النقاط: {totalPoints()}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>المجموعات (تجريبي)</Text>
        <View style={{flexDirection:'row', marginBottom:8}}>
          <TextInput placeholder="اسم المجموعة" value={groupName} onChangeText={setGroupName} style={[styles.input, {flex:1}]} />
          <TouchableOpacity style={styles.addBtn} onPress={createGroup}><Text style={{color:'#fff'}}>إنشاء</Text></TouchableOpacity>
        </View>
        <View style={{flexDirection:'row', marginBottom:8}}>
          <TextInput placeholder="رمز الانضمام" value={currentGroupCode} onChangeText={setCurrentGroupCode} style={[styles.input, {flex:1}]} />
          <TouchableOpacity style={styles.addBtn} onPress={joinGroupByCode}><Text style={{color:'#fff'}}>انضمام</Text></TouchableOpacity>
        </View>
        <FlatList data={groups} keyExtractor={i=>i.id} renderItem={({item})=>(
          <View style={{padding:8, backgroundColor:'#f3f3f3', marginBottom:6}}>
            <Text style={{fontWeight:'bold'}}>{item.name}</Text>
            <Text>رمز: {item.code}</Text>
            <Text>أعضاء: {item.members.length}</Text>
          </View>
        )} ListEmptyComponent={<Text style={{color:'#666'}}>لا توجد مجموعات</Text>} />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, padding:16, backgroundColor:'#fff'},
  header:{fontSize:18, fontWeight:'700', marginBottom:12, textAlign:'center'},
  row:{flexDirection:'row', marginBottom:12},
  input:{borderWidth:1, borderColor:'#ddd', padding:8, borderRadius:6, flex:1},
  addBtn:{backgroundColor:'#0a84ff', padding:10, marginLeft:8, borderRadius:6, justifyContent:'center', alignItems:'center'},
  rowSmall:{flexDirection:'row', alignItems:'center', marginBottom:12},
  rateBtn:{padding:8, borderWidth:1, borderColor:'#ddd', borderRadius:6, marginRight:6},
  rateBtnSel:{backgroundColor:'#0a84ff', borderColor:'#0a84ff'},
  section:{marginTop:12},
  sectionTitle:{fontWeight:'700', marginBottom:8},
  task:{flexDirection:'row', padding:10, backgroundColor:'#fafafa', borderRadius:8, marginBottom:8, alignItems:'center'},
  title:{fontWeight:'600'},
  meta:{color:'#666', marginTop:4},
  points:{fontWeight:'700'},
  btn:{backgroundColor:'#0a84ff', padding:6, borderRadius:6, marginTop:6},
  btnText:{color:'#fff'},
  footer:{padding:10, alignItems:'center'}
});
