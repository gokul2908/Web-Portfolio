import { Button } from '@mui/material';
import { ReactElement } from 'react';
import user from '../../user_details';
import './users.css';

function Users(): ReactElement {
    // const userList = user.map(e=> e.name)
    return (
        <div className='vh-100 d-flex justify-content-center align-items-center'>
            {user.map((each, i) => {
                const hrefVal = `./${each.name}`;
                return (
                    <a href={hrefVal} key={i}>
                        <Button variant='outlined' className='m-3'>
                            {each.name}
                        </Button>
                    </a>
                );
            })}
        </div>
    );
}

export default Users;
