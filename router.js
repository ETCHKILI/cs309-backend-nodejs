const express = require('express')
const router = express.Router()
const pool = require('./database')

const sqlSearchUsr = 'SELECT * FROM account WHERE username = $1'
const sqlRegisterUsr = 'INSERT INTO account(username, password) VALUES($1, $2)'
const sqlListHotel = 'SELECT id, name, city, district, date, check_time, price, type FROM hotel WHERE valid is TRUE '
const schCondDate = ' AND date = $'
const schCondRoomType = ' AND type = $'
const offsetCond = ' ORDER BY id LIMIT 20 OFFSET 0 '
const sqlAddHotel = 'INSERT INTO hotel(name, city, district, date, check_time, price, type) VALUES ($1, $2, $3, $4, $5, $6, $7)'
const sqlDelHotel = 'UPDATE hotel SET valid = false WHERE id = $1'
const sqlSearchHotelByID = 'SELECT id, name, city, district, date, check_time, price, type FROM hotel WHERE valid is TRUE AND id = $1'
const sqlUpdateHotelByID = "UPDATE hotel SET (name, city, district, date, check_time, price, type) = ($1, $2, $3, $4, $5, $6, $7) WHERE id = $8"


router.get('/', function (req, res) {
    res.redirect('/login')
});

router.get('/login', function (req, res) {
    if (!req.session.isLogin) {
        req.session.isLogin = false
    }
    let username = req.cookies.username;
    res.render('login.html', { ckUsr: username })
});

router.post('/login', async function (req, res) {

    await pool.query(sqlSearchUsr, [req.body.username], (err, queryRes) => {
        if (databaseErr(err, res)) {return}

        const cookies = req.cookies
        if (queryRes.rows.length === 0) {
            res.render('login.html', { ckUsr: cookies.username, loginMessage: 'Username doesn\'t exist!'})
        } else if (queryRes.rows.length === 1) {
            if(queryRes.rows[0].password !== req.body.password) {
                res.render('login.html', { ckUsr: cookies.username, loginMessage: 'The Username or Password is wrong!'})
            } else {
                res.cookie('username', req.body.username, {httpOnly: true, sameSite: 'lax'})
                req.session.isLogin = true
                res.redirect('/hotel')
            }
        }
    })
});

router.get('/register', function (req, res) {
    res.render('register.html')
});

router.post('/register', async function (req, res) {
    await pool.query(sqlSearchUsr, [req.body.username], async (err, queryRes) => {
        if (databaseErr(err, res)) {
            return
        }
        if (queryRes.rows.length !== 0) {
            res.render('register.html', {registerMessage: 'Username already exist!'})
        }
        if (queryRes.rows.length === 0) {
            // res.send("<script>alert('注册成功！');location.href='/login';</script>");
            if (!req.body.username || !req.body.password) {
                res.render('register.html', {registerMessage: 'Username or Password should not be empty'})
            } else if (req.body.password !== req.body.cfmPassword) {
                res.render('register.html', {registerMessage: 'Two passwords are not the same!'})
            } else {
                await pool.query(sqlRegisterUsr, [req.body.username, req.body.password])
                res.cookie('username', req.body.username, {httpOnly: true, sameSite: 'lax'})
                res.send("<head><script>alert('Rigistered Successfully！')</script>" +
                    "<meta http-equiv=\"Refresh\" content=\"0; URL=/login\" /><title>Rigistered Successfully</title></head>\n")
            }
        }
    })
});

router.all(/^\/hotel(\/.*)*/, function (req, res, next){
    if (req.session.isLogin) {
        next()
    } else {
        res.redirect('/login')
    }
})

router.get('/hotel', async function (req, res) {
    let cnt = 0
    let paramList = []
    let sqlText = sqlListHotel
    if (req.query.date) {
        ++cnt
        paramList.push(req.query.date)
        sqlText += schCondDate + cnt
    }
    if (req.query.type && req.query.type !== 'Any') {
        ++cnt
        paramList.push(req.query.type)
        sqlText += schCondRoomType + cnt
    }
    sqlText += offsetCond

    await pool.query(sqlText, paramList, (err, queryRes) => {
        if (databaseErr(err, res)) {return}
        res.render('hotelList.html', {hotelList: queryRes.rows})
    })
})

router.post('/hotel', async function (req, res) {
    if (req.body.id) {
        await pool.query(sqlDelHotel, [Number(req.body.id)], (err, queryRes) => {
            if (databaseErr(err, res)) {return}
            res.send("<head><script>alert('Deleted Successfully!')</script>" +
                "<meta http-equiv=\"Refresh\" content=\"0; URL=/hotel\" /><title>Deleted Successfully!</title></head>\n")
        })
    }
})

router.get('/hotel/add', function (req, res) {
    res.render('hotelAdd.html')
})

router.post('/hotel/add', async function (req, res) {
    let fm = req.body
    let paramList = [fm.name, fm.city, fm.district, fm.date, fm.check_time, fm.price, fm.type]
    await pool.query(sqlAddHotel, paramList, (err, queryRes) => {
        if (databaseErr(err, res)) {return}
        res.send("<head><script>alert('Added Successfully!')</script>" +
            "<meta http-equiv=\"Refresh\" content=\"0; URL=/hotel\" /><title>Added Successfully</title></head>\n")
    })
})

router.get('/hotel/update', async function (req, res) {
    let id = req.query.id
    console.log(id);
    if (!id) {
        res.redirect('/hotel')
        return
    }
    await pool.query(sqlSearchHotelByID, [Number(id)], (err, queryRes) => {
        if (databaseErr(err, res)) {return}
        if(queryRes.rows.length !== 1) {res.send('Database error: duplicated record'); console.log(queryRes.rows); return;}
        console.log(queryRes.rows)
        let row = queryRes.rows[0]
        res.render('hotelUpdate.html', {
            id: row.id,
            name: row.name,
            city: row.city,
            district: row.district,
            date: row.date,
            check_time: row.check_time,
            price: row.price,
            type: row.type
        })
    })

})

router.post('/hotel/update', async function (req, res) {
    let fm = req.body
    let paramList = [fm.name, fm.city, fm.district, fm.date, fm.check_time, fm.price, fm.type, fm.id]
    await pool.query(sqlUpdateHotelByID, paramList, (err, queryRes) => {
        if (databaseErr(err, res)) {return}
        res.send("<head><script>alert('Updated Successfully!')</script>" +
            "<meta http-equiv=\"Refresh\" content=\"0; URL=/hotel\" /><title>Updated Successfully</title></head>\n")
    })
})

function databaseErr(err, res) {
    if (err) {
        console.log(err.stack)
        res.status(500).send('Database Error')
        return true
    }
    return false
}

module.exports = router




