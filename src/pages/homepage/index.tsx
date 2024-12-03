import React, { ReactElement } from 'react';
import { useParams } from 'react-router-dom';
import Intro from '../../components/intro';
import Projects from '../../components/projects';
import user from '../../user_details';
import ResponsiveAppBar from '../../components/navigation';

import './homepage.css';
import { Container } from '@mui/material';

function Homepage(): ReactElement {
    const { name } = useParams() as { name: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let userDetails = user.find((e: any) => e.name?.toLowerCase() === name); //not working
    if (!userDetails) userDetails = user[0];

    return (
        <>
            <ResponsiveAppBar {...userDetails} />
            <Container
                maxWidth='xl'
                sx={{
                    width: '100%',
                    padding: '0px !important',
                }}
            >
                <div className='y-mandatory'>
                    <div className='wrapper'>
                        {[Intro, Projects].map((Component, i) => (
                            <Component {...userDetails} key={i} />
                        ))}
                    </div>
                </div>
            </Container>
        </>
    );
}

export default Homepage;
